const fetch = require('node-fetch');

const RELATIONAL_SEO_API_KEY = process.env.RELATIONAL_SEO_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const formData = JSON.parse(event.body);

    const query = formData.query?.trim();
    if (!query || query.length < 5 || query.length > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid query format' }),
      };
    }

    const businessName = formData.businessName?.trim();
    if (!businessName || businessName.length < 2 || businessName.length > 200) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid business name format' }),
      };
    }

    const websiteUrl = formData.websiteUrl?.trim();
    if (!websiteUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Website URL is required' }),
      };
    }

    const industryType = formData.industryType?.trim();
    if (!industryType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Industry type is required' }),
      };
    }

    const location = formData.location?.trim();
    if (!location) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Location is required' }),
      };
    }

    const verticalType = formData.verticalType?.trim();
    if (!verticalType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Vertical type is required' }),
      };
    }

    const businessStructure = formData.businessStructure?.trim();
    if (!businessStructure) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Business structure is required' }),
      };
    }

    const credentials = formData.credentials?.trim() || '';
    const associations = formData.associations?.trim() || '';

    const apiUrl = `https://api.relationalseo.com/localListingsPack?query=${encodeURIComponent(query)}&key=${RELATIONAL_SEO_API_KEY}`;

    const relationalResponse = await fetch(apiUrl);

    if (!relationalResponse.ok) {
      const errorText = await relationalResponse.text();
      console.error('Relational SEO API error:', relationalResponse.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch local listings data' }),
      };
    }

    const listingsData = await relationalResponse.json();

    let contextText = `Query: "${query}"\n\n`;
    contextText += `Business: ${businessName}\n`;
    contextText += `Website: ${websiteUrl}\n`;
    contextText += `Industry: ${industryType}\n`;
    contextText += `Location: ${location}\n`;
    contextText += `Vertical: ${verticalType}\n`;
    contextText += `Structure: ${businessStructure}\n`;
    if (credentials) contextText += `Credentials: ${credentials}\n`;
    if (associations) contextText += `Associations: ${associations}\n`;
    contextText += `\nLocal Listings Data:\n${JSON.stringify(listingsData, null, 2)}`;

    const systemPrompt = `You are a local SEO analyst specializing in "Search Everywhere Domination" audits for service businesses. Your task is to analyze local search results and provide a comprehensive, actionable audit.

Output your audit in markdown format with clear sections. Structure your audit as follows:

# Search Everywhere Domination Audit

## Executive Summary
Provide a brief 2-3 sentence overview of the client's current visibility for the target query and the primary opportunities identified.

## Current Ranking Analysis
- List the top 3 positions in the local pack with their business names and key attributes
- Identify where the client currently ranks (if visible) or note their absence
- Highlight which competitors dominate multiple positions

## Competitive Landscape
Analyze the top 3-5 competitors focusing on:
- What makes them stand out in the listings (reviews, ratings, categories)
- Common patterns among top performers
- Gaps or weaknesses the client could exploit

## Strategic Recommendations
Provide specific, prioritized action items organized by:

### Immediate Priorities (0-30 days)
Actionable items that can quickly improve visibility

### Medium-term Initiatives (1-3 months)
Strategic improvements requiring more effort or time

### Long-term Strategy (3-6 months)
Foundational changes for sustained dominance

## Key Differentiators to Emphasize
Based on the client's vertical type and business structure, recommend specific positioning strategies and messaging angles.

Keep the tone professional but conversational. Be specific and actionable rather than generic. Reference actual data from the search results to support your recommendations.`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: contextText,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errorText);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to generate audit' }),
      };
    }

    const anthropicData = await anthropicResponse.json();
    const auditText = anthropicData.content[0].text;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ audit: auditText }),
    };
  } catch (error) {
    console.error('Error in audit function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};