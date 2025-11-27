/**
 * Sample documents for RAG agent
 * Use these to populate the index for testing
 */

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc:trend-2025-1',
    title: '2025 Fall Color Trends',
    content: `The 2025 fall fashion season brings a focus on muted warm tones. Peach, terracotta, and soft indigo are dominating the color palette. These colors work exceptionally well for both casual and formal occasions. Designers are emphasizing comfort and versatility, with many pieces designed to transition seamlessly from day to night. The trend towards sustainable fashion continues, with many brands offering eco-friendly options in these trending colors.`,
    url: 'https://example.com/2025-fall-colors',
    metadata: {
      category: 'trends',
      year: 2025,
      season: 'fall',
    },
  },
  {
    id: 'doc:brand-denimco-fit-guide',
    title: 'DenimCo Fit Guide',
    content: `DenimCo provides comprehensive sizing guidance for all our denim products. For straight-fit jeans, we recommend ordering true to size based on your waist measurement. For slim-fit and stretch styles, consider sizing up by one size for optimal comfort. Our high-rise styles tend to run slightly smaller in the waist, so you may want to size up if you prefer a looser fit. Always refer to our detailed size chart which includes measurements for waist, hip, inseam, and rise.`,
    url: 'https://denimco.example/fit',
    metadata: {
      category: 'sizing',
      brand: 'DenimCo',
      productType: 'denim',
    },
  },
  {
    id: 'doc:returns-analytics-2024',
    title: 'Returns Analytics Q4 2024',
    content: `Industry-wide returns data for Q4 2024 shows that bottoms (jeans, skirts, pants) have the highest return rates at 65% for online purchases. The primary reasons cited are incorrect sizing (45%), color mismatch (25%), and fit issues (20%). Tops and outerwear show lower return rates at 35% and 28% respectively. The data suggests that providing detailed size guides, accurate color representation, and fit recommendations can significantly reduce return rates.`,
    url: 'https://industry.example/returns-q4-2024',
    metadata: {
      category: 'analytics',
      quarter: 'Q4',
      year: 2024,
    },
  },
  {
    id: 'doc:style-occasion-formal',
    title: 'Styling for Formal Occasions',
    content: `For formal events, opt for classic silhouettes in neutral or deep colors. A well-fitted blazer paired with tailored trousers or a midi skirt creates a polished look. Accessories should be minimal and elegant - think simple jewelry and structured handbags. Shoes should be closed-toe and comfortable enough for extended wear. When in doubt, choose quality over quantity - one well-made piece is better than several fast-fashion items.`,
    url: 'https://example.com/formal-styling',
    metadata: {
      category: 'styling',
      occasion: 'formal',
    },
  },
  {
    id: 'doc:style-occasion-casual',
    title: 'Casual Everyday Styling',
    content: `Casual styling emphasizes comfort and personal expression. Layering is key - start with a base layer like a simple t-shirt or tank, add a cardigan or light jacket, and finish with comfortable footwear. Denim is versatile for casual wear, whether in jeans, jackets, or skirts. Accessories can be more playful and personal. The goal is to feel comfortable and confident while expressing your personal style.`,
    url: 'https://example.com/casual-styling',
    metadata: {
      category: 'styling',
      occasion: 'casual',
    },
  },
  {
    id: 'doc:fabric-care-cotton',
    title: 'Cotton Fabric Care Guide',
    content: `Cotton is a natural fiber that requires proper care to maintain its quality. Wash cotton items in cold or warm water to prevent shrinking. Use a gentle detergent and avoid bleach unless the garment specifically allows it. Tumble dry on low heat or air dry to prevent excessive shrinkage. Iron while slightly damp for best results. Store cotton items in a cool, dry place to prevent yellowing.`,
    url: 'https://example.com/cotton-care',
    metadata: {
      category: 'care',
      fabric: 'cotton',
    },
  },
  {
    id: 'doc:size-chart-women',
    title: 'Women\'s Size Chart',
    content: `Standard women's sizing varies by brand, but general guidelines apply. XS typically fits 0-2, S fits 4-6, M fits 8-10, L fits 12-14, and XL fits 16-18. However, international sizing can differ significantly. Always check the specific brand's size chart. Measurements to consider include bust (chest), waist, and hips. For best fit, measure yourself while wearing undergarments and compare to the brand's size chart.`,
    url: 'https://example.com/womens-sizing',
    metadata: {
      category: 'sizing',
      gender: 'women',
    },
  },
  {
    id: 'doc:thanksgiving-styling',
    title: 'Thanksgiving Dinner Styling Tips',
    content: `For Thanksgiving dinner with family, choose comfortable yet polished pieces. A warm knit sweater in muted peach or burgundy pairs well with mid-rise indigo jeans or a comfortable skirt. The key is to balance comfort for a long meal with a put-together appearance. Avoid overly tight clothing and opt for pieces with some stretch. Layers work well as indoor temperatures can vary. Accessories should be minimal - perhaps a simple necklace or earrings.`,
    url: 'https://example.com/thanksgiving-styling',
    metadata: {
      category: 'styling',
      occasion: 'thanksgiving',
      season: 'fall',
    },
  },
];

/**
 * Initialize the RAG agent with sample documents
 */
export async function initializeRAGWithSamples() {
  const { ragAgent } = await import('./RAGAgent.js');
  await ragAgent.indexDocuments(SAMPLE_DOCUMENTS);
  console.log(`✅ Initialized RAG agent with ${SAMPLE_DOCUMENTS.length} sample documents`);
}


