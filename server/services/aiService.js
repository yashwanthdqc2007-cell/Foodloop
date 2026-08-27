const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

const isAiEnabled = () => {
    return !!process.env.GEMINI_API_KEY;
};

// Fallback logic if AI is unavailable or failing
const fallbackClassification = (foodName) => {
    const lower = foodName.toLowerCase();
    let category = 'Prepared Meal';
    let type = 'Non-Vegetarian';
    
    if (lower.includes('veg') || lower.includes('paneer') || lower.includes('salad')) {
        type = 'Vegetarian';
    }
    if (lower.includes('cake') || lower.includes('bread') || lower.includes('cookie')) {
        category = 'Bakery';
    }
    
    return {
        category,
        type,
        confidence: 'Fallback Rule-Based'
    };
};

const classifyFood = async (foodName) => {
    if (!isAiEnabled()) {
        return fallbackClassification(foodName);
    }
    
    try {
        const prompt = `Classify the following food item: "${foodName}". 
        Return a JSON object with strictly these keys:
        - "category" (e.g., Prepared Meal, Bakery, Produce, Grocery)
        - "type" (Vegetarian, Non-Vegetarian, Vegan)
        - "confidence" (High, Medium, Low)
        Do not return any markdown formatting, only the JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('AI Classification failed, using fallback:', error);
        return fallbackClassification(foodName);
    }
};

const fallbackDemandEstimation = (availableQuantity) => {
    // Arbitrary demo logic: 70% customer, 30% community
    return {
        expectedCustomerDemand: Math.ceil(availableQuantity * 0.7),
        expectedCommunityDemand: Math.floor(availableQuantity * 0.3)
    };
};

const estimateDemand = async (restaurantName, foodName, day, time, availableQuantity) => {
    if (!isAiEnabled()) {
        return fallbackDemandEstimation(availableQuantity);
    }

    try {
        const prompt = `Estimate the demand for ${availableQuantity} portions of "${foodName}" from restaurant "${restaurantName}" on a ${day} at ${time}.
        Assume historical data shows a high demand for discounted meals in this area.
        Return a JSON object with strictly these keys:
        - "expectedCustomerDemand" (integer)
        - "expectedCommunityDemand" (integer)
        Do not return any markdown formatting, only the JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('AI Demand Estimation failed, using fallback:', error);
        return fallbackDemandEstimation(availableQuantity);
    }
};

const fallbackAllocation = (available, customerDemand, communityDemand, communityCapacity) => {
    const donate = Math.min(communityDemand, communityCapacity, available);
    const sell = Math.min(customerDemand, available - donate);
    return {
        customerAllocation: sell,
        communityAllocation: donate
    };
};

const recommendAllocation = async (available, customerDemand, communityDemand, communityCapacity) => {
    if (!isAiEnabled()) {
        return fallbackAllocation(available, customerDemand, communityDemand, communityCapacity);
    }

    try {
        const prompt = `We have ${available} portions of food available.
        Expected customer demand: ${customerDemand} portions.
        Expected community demand: ${communityDemand} portions.
        Available community capacity: ${communityCapacity} portions.
        Recommend how to allocate the available portions between customers and the community to minimize waste while maximizing social impact and revenue recovery.
        Return a JSON object with strictly these keys:
        - "customerAllocation" (integer)
        - "communityAllocation" (integer)
        - "explanation" (string)
        Ensure that customerAllocation + communityAllocation <= ${available}.
        Do not return any markdown formatting, only the JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('AI Allocation Recommendation failed, using fallback:', error);
        return fallbackAllocation(available, customerDemand, communityDemand, communityCapacity);
    }
};

module.exports = {
    classifyFood,
    estimateDemand,
    recommendAllocation,
    isAiEnabled
};
