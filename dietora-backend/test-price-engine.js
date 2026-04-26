require('dotenv').config();
console.log('\n════════════════════════════════════════════════');
console.log('  DIETORA Price Engine — Diagnostic Test');
console.log('════════════════════════════════════════════════\n');
console.log('STEP 1: Environment Variables');
const geminiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL;
console.log('  GEMINI_API_KEY :', geminiKey ? '✅ Set (' + geminiKey.slice(0,12) + '...)' : '❌ MISSING');
console.log('  GEMINI_MODEL   :', geminiModel || '(default: gemini-2.5-flash)');
if (!geminiKey) { console.log('\n❌ FATAL: GEMINI_API_KEY missing\n'); process.exit(1); }
console.log('\nSTEP 2: Package Check');
let GoogleGenAI;
try {
  ({ GoogleGenAI } = require('@google/genai'));
  console.log('  @google/genai  : ✅ Installed');
} catch (err) {
  console.log('  @google/genai  : ❌ NOT FOUND — run: npm install @google/genai');
  process.exit(1);
}
console.log('\nSTEP 3: Client Instantiation');
let ai;
try {
  ai = new GoogleGenAI({ apiKey: geminiKey });
  console.log('  Client created : ✅');
} catch (err) {
  console.log('  Client failed  : ❌', err.message);
  process.exit(1);
}
console.log('\nSTEP 4: Live Grounding Call (3 foods)...\n');
const prompt = "Search Google for CURRENT food prices in Faisalabad Pakistan. DHABA SERVING PRICES ONLY. Return ONLY JSON: {\"Chicken Karahi\":0,\"Dal Masoor\":0,\"Tandoori Roti\":0} with real PKR integer values.";
async function run() {
  try {
    const response = await ai.models.generateContent({
      model: geminiModel || 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.05, maxOutputTokens: 512 },
    });
    const queries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
    console.log('  Grounding     :', queries.length > 0 ? '✅ YES — searched Google' : '❌ NO — training data only');
    if (queries.length) console.log('  Queries       :', queries.join(' | '));
    const raw = response.text;
    console.log('  Raw response  :', raw?.slice(0,200));
    const match = raw?.replace(/```(?:json)?/g,'').match(/\{[\s\S]*\}/);
    if (!match) { console.log('\n❌ No JSON in response'); return; }
    const prices = JSON.parse(match[0]);
    console.log('\n  Prices:');
    for (const [k,v] of Object.entries(prices)) console.log('   ', k+':', 'PKR', v);
    console.log('\n✅ Test complete — paste this output in chat');
  } catch (err) {
    console.log('\n❌ ERROR:', err.constructor?.name);
    console.log('  Message:', err.message?.slice(0,400));
    console.log('  Status :', err.status || err.code || 'N/A');
    if ((err.message||'').includes('403')) console.log('\n  → ROOT CAUSE: Free Gemini API does NOT support Google Search grounding');
    else if ((err.message||'').includes('429')) console.log('\n  → QUOTA EXCEEDED');
    else if ((err.message||'').includes('401')) console.log('\n  → INVALID API KEY');
    console.log('\n  Paste this output in chat for diagnosis');
  }
}
run();
