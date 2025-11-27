# SenseSpace Content Renderer

Implementation of Verisense SenseSpace Content Rendering specification for rich and interactive user experiences.

## Overview

The SenseSpace Content Renderer supports various content rendering formats as specified in the Verisense documentation:

- **Markdown Standard Format**: Full Markdown support with headings, text formatting, lists, links, images, code blocks, tables, and blockquotes
- **XML Card Rendering**: Special XML tags for interactive cards
  - `<tool>` - Function calls and results
  - `<miniapp>` - MiniApp launcher cards
  - `<payment>` - Payment confirmation requests
- **Mixed Content**: Seamlessly combines Markdown with XML cards

## Components

### `SenseSpaceContentRenderer`

Main component that parses and renders mixed content.

```tsx
import { SenseSpaceContentRenderer } from '@/components/sensespace';

<SenseSpaceContentRenderer
  content={messageContent}
  onMiniAppOpen={(id, url) => {
    // Handle MiniApp opening
  }}
  onPaymentConfirm={async (intentId) => {
    // Handle payment confirmation
  }}
/>
```

**Props:**
- `content: string` - The content to render (can include Markdown and XML tags)
- `className?: string` - Additional CSS classes
- `onMiniAppOpen?: (id: string, url: string) => void` - Callback when MiniApp is opened
- `onPaymentConfirm?: (intentId: string) => Promise<void> | void` - Callback when payment is confirmed

### Individual Card Components

- `ToolCard` - Renders function calls and results
- `MiniAppCard` - Renders MiniApp launcher
- `PaymentCard` - Renders payment confirmation request

## Usage Examples

### Markdown Content

```tsx
const markdown = `
# Heading 1
## Heading 2
**Bold** and *italic* text
- List item
`;

<SenseSpaceContentRenderer content={markdown} />
```

### Tool Card

```tsx
const toolContent = `
<tool>
    <func>calculate sum</func>
    <result>The sum of 5 + 3 = 8</result>
</tool>
`;

<SenseSpaceContentRenderer content={toolContent} />
```

### MiniApp Card

```tsx
const miniappContent = `
<miniapp>
    <id>weather-app</id>
    <url>https://weather.sensespace.xyz/app</url>
</miniapp>
`;

<SenseSpaceContentRenderer
  content={miniappContent}
  onMiniAppOpen={(id, url) => {
    window.open(url, '_blank');
  }}
/>
```

### Payment Card

```tsx
const paymentContent = `
<payment>
  <intent-id>xxx</intent-id>
</payment>
`;

<SenseSpaceContentRenderer
  content={paymentContent}
  onPaymentConfirm={async (intentId) => {
    // Send payment confirmation to agent
    await sendMessage(`Payment confirmed: ${intentId}`);
  }}
/>
```

### Mixed Content

```tsx
const mixedContent = `
# Weather Analysis Report

Today's weather data has been processed.

<tool>
    <func>analyze weather data</func>
    <result>Temperature: 22°C, Humidity: 65%</result>
</tool>

For more details:

<miniapp>
    <id>weather-forecast</id>
    <url>https://weather.sensespace.xyz/forecast</url>
</miniapp>
`;

<SenseSpaceContentRenderer content={mixedContent} />
```

## XML Tag Format

### Tool Card

```xml
<tool>
    <func>function name or description</func>
    <result>function result</result>
</tool>
```

### MiniApp Card

```xml
<miniapp>
    <id>app-identifier</id>
    <url>https://miniapp-domain.com/xxx</url>
</miniapp>
```

### Payment Card

```xml
<payment>
  <intent-id>payment-intent-id</intent-id>
</payment>
```

## Integration

The content renderer is already integrated into:

- `VoiceInterface` - For voice assistant messages
- `Hero` - For hero section conversations
- `VerisenseDemo` - For agent output display

## Demo

See `SenseSpaceContentRendererDemo.tsx` for a complete demonstration of all supported formats.

## Implementation Details

- Uses `react-markdown` for Markdown rendering
- Uses `remark-gfm` for GitHub Flavored Markdown support
- Custom XML parser extracts and processes XML tags
- Cards are rendered as interactive UI components using shadcn/ui
- Supports dark mode styling

## References

Based on Verisense SenseSpace Content Rendering specification:
- [Verisense Documentation](https://docs.verisense.network/)
- SenseSpace Content Rendering Guide


