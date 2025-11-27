# Agent2Agent (A2A) Protocol Integration Guide

This guide explains how to integrate your Agent with the A2A protocol for interoperability with other Agents on the Sensespace platform.

## What is the A2A Protocol?

The Agent2Agent (A2A) Protocol is an open standard developed by Google and donated to the Linux Foundation designed to enable seamless communication and collaboration between AI agents. In a world where agents are built using diverse frameworks and by different vendors, A2A provides a common language, breaking down silos and fostering interoperability.

For comprehensive documentation and specifications, visit the [official A2A Protocol website](https://a2aproject.org/).

## Relationship between A2A and MCP

A2A and Model Context Protocol (MCP) are complementary standards for building robust agentic applications:

- **MCP (Model Context Protocol)**: Provides agent-to-tool communication, standardizing how an agent connects to its tools, APIs, and resources to get information
- **A2A (Agent2Agent Protocol)**: Provides agent-to-agent communication, acting as a universal, decentralized standard that allows AI agents to interoperate, collaborate, and share discoveries

A2A acts as the public internet that allows AI agents—including those using MCP or built with frameworks—to interoperate, collaborate, and share their findings.

## Essential Integration Components

### 1. Install A2A SDK

First, install the A2A SDK for your language:

```bash
# Python
pip install a2a-python

# JavaScript
npm install a2a-js

# Java
# Refer to https://github.com/a2aproject/a2a-java

# C#/.NET
# Refer to https://github.com/a2aproject/a2a-dotnet

# Go
# Refer to https://github.com/a2aproject/a2a-go
```

### 2. Create Agent Executor

Implement the `AgentExecutor` interface, which is the core component of the A2A protocol:

```python
from a2a.server.agent_execution import AgentExecutor
from a2a.types import (
    RequestContext,
    EventQueue,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent,
    TaskStatus,
    TaskState,
    new_text_artifact,
    new_agent_text_message,
)
from typing import AsyncIterable


class YourAgentExecutor(AgentExecutor):
    """Your Agent Implementation."""

    def __init__(self):
        # Initialize your agent
        self.agent = YourAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue
    ) -> None:
        """Execute the agent task."""
        try:
            # Get user input
            query = context.get_user_input()
            task = context.current_task

            # Process message and generate response
            async for event in self.agent.stream(query):
                if event['is_task_complete']:
                    # Send final result when task is complete
                    await event_queue.enqueue_event(
                        TaskArtifactUpdateEvent(
                            append=False,
                            context_id=task.context_id,
                            task_id=task.id,
                            last_chunk=True,
                            artifact=new_text_artifact(
                                name='current_result',
                                description='Agent response result.',
                                text=event['content'],
                            ),
                        )
                    )
                    await event_queue.enqueue_event(
                        TaskStatusUpdateEvent(
                            status=TaskStatus(state=TaskState.completed),
                            final=True,
                            context_id=task.context_id,
                            task_id=task.id,
                        )
                    )
                    break  # Exit loop when task is complete
                    
                elif event['require_user_input']:
                    # When user input is required
                    await event_queue.enqueue_event(
                        TaskStatusUpdateEvent(
                            status=TaskStatus(
                                state=TaskState.input_required,
                                message=new_agent_text_message(
                                    event['content'],
                                    task.context_id,
                                    task.id,
                                ),
                            ),
                            final=True,
                            context_id=task.context_id,
                            task_id=task.id,
                        )
                    )
                else:
                    # Status updates while work is in progress
                    await event_queue.enqueue_event(
                        TaskStatusUpdateEvent(
                            append=True,
                            status=TaskStatus(
                                state=TaskState.working,
                                message=new_agent_text_message(
                                    event['content'],
                                    task.context_id,
                                    task.id,
                                ),
                            ),
                            final=False,
                            context_id=task.context_id,
                            task_id=task.id,
                        )
                    )
        except Exception as e:
            # Handle errors gracefully
            await event_queue.enqueue_event(
                TaskStatusUpdateEvent(
                    status=TaskStatus(
                        state=TaskState.error,
                        message=new_agent_text_message(
                            f"Error occurred: {str(e)}",
                            task.context_id,
                            task.id,
                        ),
                    ),
                    final=True,
                    context_id=task.context_id,
                    task_id=task.id,
                )
            )

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        """Implement cancellation logic."""
        task = context.current_task
        # Cancel your agent's processing
        if hasattr(self.agent, 'cancel'):
            await self.agent.cancel()
        
        # Notify that task was cancelled
        await event_queue.enqueue_event(
            TaskStatusUpdateEvent(
                status=TaskStatus(state=TaskState.cancelled),
                final=True,
                context_id=task.context_id,
                task_id=task.id,
            )
        )
```

### 3. Implement Agent Streaming

Your Agent needs to support streaming output, returning standardized event format:

```python
from typing import AsyncIterable, Dict, Any


class YourAgent:
    """Example agent implementation with streaming support."""

    async def stream(self, query: str) -> AsyncIterable[Dict[str, Any]]:
        """Stream responses from your agent.

        Args:
            query: User query string

        Yields:
            Dictionary with keys:
                - is_task_complete: Whether task is complete
                - require_user_input: Whether user input is required
                - content: Response content
        """
        # Process query and generate response
        accumulated_content = ""
        
        for chunk in self.process_query(query):
            accumulated_content += chunk
            yield {
                'is_task_complete': False,
                'require_user_input': False,
                'content': chunk
            }

        # Final response
        yield {
            'is_task_complete': True,
            'require_user_input': False,
            'content': accumulated_content or 'Task completed successfully'
        }

    def process_query(self, query: str):
        """Process the query and yield chunks.
        
        This is a placeholder - implement your actual agent logic here.
        """
        # Example: Simple streaming response
        words = query.split()
        for word in words:
            yield word + " "
```

### 4. Configure Agent Card

Create an Agent Card describing your Agent's capabilities and skills:

```python
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)


skill = AgentSkill(
    id='your_agent_skill',
    name='Your Agent Skill',
    description='Description of what your agent can do',
    tags=['tag1', 'tag2'],
    examples=['Example query 1', 'Example query 2'],
)


agent_card = AgentCard(
    name='Your Agent Name',
    description='Description of your agent',
    url='http://localhost:8080/',  # Agent service URL
    version='1.0.0',
    default_input_modes=['text'],
    default_output_modes=['text'],
    capabilities=AgentCapabilities(
        streaming=True,  # Support streaming
        input_modes=['text'],
        output_modes=['text'],
    ),
    skills=[skill],
)
```

### 5. Start A2A Server

Finally, create and start the A2A server:

```python
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers.default_request_handler import DefaultRequestHandler
from a2a.server.tasks.inmemory_task_store import InMemoryTaskStore


def main():
    """Main entry point for the A2A server."""
    # Create task store and request handler
    task_store = InMemoryTaskStore()
    request_handler = DefaultRequestHandler(
        agent_executor=YourAgentExecutor(),
        task_store=task_store,
    )

    # Create A2A application
    server = A2AStarletteApplication(
        agent_card=agent_card,
        http_handler=request_handler
    )

    # Start server
    uvicorn.run(
        server.build(),
        host='0.0.0.0',
        port=8080
    )


if __name__ == '__main__':
    main()
```

## Integration Examples with Different Frameworks

### LangGraph Integration

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from typing import AsyncIterable, Dict, Any
import json


class LangGraphAgent:
    """LangGraph agent with A2A protocol support."""

    def __init__(self, tools=None, system_prompt=None):
        self.model = ChatOpenAI(model="gpt-4")
        self.agent_runnable = create_react_agent(
            self.model,
            tools=tools or [],
            prompt=system_prompt,
        )

    async def stream(self, query: str, session_id: str) -> AsyncIterable[Dict[str, Any]]:
        """Stream LangGraph agent responses in A2A format."""
        config = {'configurable': {'thread_id': session_id}}
        langgraph_input = {'messages': [('user', query)]}

        accumulated_content = ""
        
        async for chunk in self.agent_runnable.astream_events(
            langgraph_input, config, version='v1'
        ):
            # Process LangGraph events and convert to A2A format
            a2a_event = self.convert_to_a2a_format(chunk)
            
            if a2a_event:
                accumulated_content += a2a_event.get('content', '')
                yield a2a_event

        # Final completion event
        yield {
            'is_task_complete': True,
            'require_user_input': False,
            'content': accumulated_content
        }

    def convert_to_a2a_format(self, langgraph_chunk: Dict) -> Dict[str, Any]:
        """Convert LangGraph event to A2A format."""
        # Extract relevant information from LangGraph event
        event_type = langgraph_chunk.get('event', '')
        event_data = langgraph_chunk.get('data', {})
        
        if event_type == 'on_chat_model_stream':
            # Extract content from model stream
            content = event_data.get('chunk', {}).get('content', '')
            if content:
                return {
                    'is_task_complete': False,
                    'require_user_input': False,
                    'content': content
                }
        
        elif event_type == 'on_tool_start':
            # Tool execution started
            tool_name = event_data.get('name', 'tool')
            return {
                'is_task_complete': False,
                'require_user_input': False,
                'content': f"[Executing {tool_name}...]"
            }
        
        # Return None for events we don't need to surface
        return None
```

### CrewAI Integration

```python
from crewai import Agent, Task, Crew
from typing import AsyncIterable, Dict, Any


class CrewAIAgent:
    """CrewAI agent with A2A protocol support."""

    def __init__(self, role: str = 'Your Agent Role', goal: str = 'Your Agent Goal'):
        self.agent = Agent(
            role=role,
            goal=goal,
            backstory='Your Agent Backstory',
        )

    async def stream(self, query: str) -> AsyncIterable[Dict[str, Any]]:
        """Stream CrewAI agent responses in A2A format."""
        task = Task(
            description=query,
            agent=self.agent,
        )

        crew = Crew(
            agents=[self.agent],
            tasks=[task],
        )

        # Execute task and stream results
        # Note: CrewAI doesn't have native streaming, so we simulate it
        yield {
            'is_task_complete': False,
            'require_user_input': False,
            'content': 'Processing your request...'
        }

        try:
            result = crew.kickoff()
            result_str = str(result)
            
            # Simulate streaming by chunking the result
            chunk_size = 100
            for i in range(0, len(result_str), chunk_size):
                chunk = result_str[i:i + chunk_size]
                yield {
                    'is_task_complete': False,
                    'require_user_input': False,
                    'content': chunk
                }
            
            # Final completion
            yield {
                'is_task_complete': True,
                'require_user_input': False,
                'content': result_str
            }
        except Exception as e:
            yield {
                'is_task_complete': True,
                'require_user_input': False,
                'content': f'Error: {str(e)}'
            }
```

## Testing Your A2A Agent

### Testing with CLI Client

```bash
# Install A2A client tools
pip install a2a-python

# Test your Agent
python -m a2a.client --agent http://localhost:8080
```

### Testing with Direct HTTP

#### Get Agent Card

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Send Message

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "message/stream",
    "params": {
      "id": "task-01",
      "sessionId": "session-123",
      "acceptedOutputModes": ["text"],
      "message": {
        "role": "user",
        "parts": [{
          "type": "text",
          "text": "Hello, how can you help me?"
        }]
      }
    }
  }'
```

## Deploy to Sensespace

Once your Agent complies with A2A protocol specifications, you can register it on the Sensespace platform:

1. **Deploy your Agent service** to a publicly accessible address
2. **Ensure the Agent service runs** on a publicly accessible port
3. **Register your Agent** at [Verisense Dashboard](https://dashboard.verisense.network)
4. **Enter the Agent's endpoint address** and test the connection

## Reference Resources

### Official Resources

- [A2A Protocol Official Documentation](https://a2aproject.org/)
- [A2A Python SDK](https://github.com/a2aproject/a2a-python)
- [A2A Sample Code Repository](https://github.com/a2aproject/a2a-examples)

### Code Examples

We strongly recommend referring to actual implementations in the official sample code repository:

- **Basic Example**: [A2A Implementation without Framework](https://github.com/a2aproject/a2a-examples/tree/main/basic)
- **LangGraph Integration**: [LangGraph A2A Agent](https://github.com/a2aproject/a2a-examples/tree/main/langgraph)
- **CrewAI Integration**: [CrewAI A2A Agent](https://github.com/a2aproject/a2a-examples/tree/main/crewai)
- **AG2 Integration**: [AG2 A2A Agent](https://github.com/a2aproject/a2a-examples/tree/main/ag2)

### Learning Tutorials

- [A2A Python Tutorial](https://a2aproject.org/tutorials/python)
- [Protocol Specification](https://a2aproject.org/specification)


