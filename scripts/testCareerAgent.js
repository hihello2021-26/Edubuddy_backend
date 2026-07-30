require('dotenv').config();
const connectDB = require('../config/db');
const { runCareerRoadmapAgent } = require('../services/agents/careerRoadmapAgent');

async function run() {
  try {
    await connectDB();
    console.log('DB connected — running career agent test...');
    const result = await runCareerRoadmapAgent({ field: 'Engineering', classLevel: 'puc12' });
    console.log('Agent result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Career agent test failed:', err);
    process.exit(2);
  }
}

run();
