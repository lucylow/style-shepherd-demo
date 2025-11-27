/**
 * SenseSpace Content Renderer
 * Renders mixed content (Markdown + XML cards) according to Verisense specification
 * 
 * Supports:
 * - Standard Markdown formatting
 * - Tool cards (<tool>)
 * - MiniApp cards (<miniapp>)
 * - Payment cards (<payment>)
 * - Mixed content (markdown + XML cards)
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseXMLTags, ParsedContent } from './contentParser';
import { ToolCard } from './ToolCard';
import { MiniAppCard } from './MiniAppCard';
import { PaymentCard } from './PaymentCard';
import { cn } from '@/lib/utils';

interface SenseSpaceContentRendererProps {
  content: string;
  className?: string;
  onMiniAppOpen?: (id: string, url: string) => void;
  onPaymentConfirm?: (intentId: string) => Promise<void> | void;
}

export function SenseSpaceContentRenderer({
  content,
  className,
  onMiniAppOpen,
  onPaymentConfirm,
}: SenseSpaceContentRendererProps) {
  const parsedParts = parseXMLTags(content);

  return (
    <div className={cn("space-y-2", className)}>
      {parsedParts.map((part, index) => {
        switch (part.type) {
          case 'markdown':
            return (
              <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize markdown rendering
                    h1: ({ ...props }: any) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                    ),
                    h2: ({ ...props }: any) => (
                      <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />
                    ),
                    h3: ({ ...props }: any) => (
                      <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
                    ),
                    p: ({ ...props }: any) => (
                      <p className="mb-2 leading-relaxed" {...props} />
                    ),
                    ul: ({ ...props }: any) => (
                      <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                    ),
                    ol: ({ ...props }: any) => (
                      <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                    ),
                    code: ({ className, ...props }: any) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto"
                          {...props}
                        />
                      );
                    },
                    blockquote: ({ ...props }: any) => (
                      <blockquote
                        className="border-l-4 border-primary pl-4 italic my-2 text-muted-foreground"
                        {...props}
                      />
                    ),
                    a: ({ ...props }: any) => (
                      <a
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                  }}
                >
                  {part.content}
                </ReactMarkdown>
              </div>
            );

          case 'tool':
            return (
              <ToolCard
                key={index}
                func={part.data?.func || ''}
                result={part.data?.result || ''}
              />
            );

          case 'miniapp':
            return (
              <MiniAppCard
                key={index}
                id={part.data?.id || ''}
                url={part.data?.url || ''}
                onOpen={onMiniAppOpen}
              />
            );

          case 'payment':
            return (
              <PaymentCard
                key={index}
                intentId={part.data?.intentId || ''}
                onConfirm={onPaymentConfirm}
              />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

