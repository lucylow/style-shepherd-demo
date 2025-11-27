/**
 * SenseSpace Content Renderer Demo
 * Demonstrates the various content rendering formats supported
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SenseSpaceContentRenderer } from './SenseSpaceContentRenderer';

const DEMO_CONTENT = {
  markdown: `# Heading 1

## Heading 2

**Bold text** and *italic text*

- List item 1
- List item 2

[Link text](https://example.com)

\`inline code\` and:

\`\`\`code
code block
\`\`\``,

  tool: `Here's a function call result:

<tool>
    <func>calculate sum</func>
    <result>The sum of 5 + 3 = 8</result>
</tool>

The calculation is complete.`,

  miniapp: `For a detailed interactive forecast, you can use our weather application:

<miniapp>
    <id>weather-forecast</id>
    <url>https://weather.sensespace.xyz/forecast</url>
</miniapp>

This will open the weather MiniApp.`,

  payment: `Please confirm your payment:

<payment>
  <intent-id>pay_1234567890</intent-id>
</payment>

Once confirmed, your order will be processed.`,

  mixed: `# Weather Analysis Report

Today's weather data has been processed successfully.

<tool>
    <func>analyze weather data</func>
    <result>Temperature: 22°C, Humidity: 65%, Conditions: Partly Cloudy</result>
</tool>

For a detailed interactive forecast, you can use our weather application:

<miniapp>
    <id>weather-forecast</id>
    <url>https://weather.sensespace.xyz/forecast</url>
</miniapp>

**Note:** This is a mixed content example showing markdown, tool cards, and MiniApp cards together.`,
};

export function SenseSpaceContentRendererDemo() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">SenseSpace Content Renderer Demo</h1>
        <p className="text-muted-foreground">
          Demonstrates various content rendering formats according to Verisense specification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Markdown Content</CardTitle>
          <CardDescription>Standard Markdown formatting</CardDescription>
        </CardHeader>
        <CardContent>
          <SenseSpaceContentRenderer content={DEMO_CONTENT.markdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool Card</CardTitle>
          <CardDescription>Function calls and results</CardDescription>
        </CardHeader>
        <CardContent>
          <SenseSpaceContentRenderer content={DEMO_CONTENT.tool} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>MiniApp Card</CardTitle>
          <CardDescription>Interactive MiniApp launcher</CardDescription>
        </CardHeader>
        <CardContent>
          <SenseSpaceContentRenderer
            content={DEMO_CONTENT.miniapp}
            onMiniAppOpen={(id, url) => {
              console.log('Opening MiniApp:', id, url);
              alert(`Would open MiniApp: ${id} at ${url}`);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Card</CardTitle>
          <CardDescription>Payment confirmation request</CardDescription>
        </CardHeader>
        <CardContent>
          <SenseSpaceContentRenderer
            content={DEMO_CONTENT.payment}
            onPaymentConfirm={async (intentId) => {
              console.log('Payment confirmed:', intentId);
              alert(`Payment confirmed for intent: ${intentId}`);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mixed Content</CardTitle>
          <CardDescription>Combining Markdown with XML cards</CardDescription>
        </CardHeader>
        <CardContent>
          <SenseSpaceContentRenderer
            content={DEMO_CONTENT.mixed}
            onMiniAppOpen={(id, url) => {
              console.log('Opening MiniApp:', id, url);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}


