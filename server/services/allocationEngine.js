const { recommendAllocation } = require('./aiService');

const allocateBatch = async (available, customerDemand, communityDemand, communityCapacity) => {
    // 1. Get AI recommendation (or deterministic fallback)
    const aiResult = await recommendAllocation(available, customerDemand, communityDemand, communityCapacity);
    
    // 2. Validation Layer (Hard Constraints)
    let { customerAllocation, communityAllocation } = aiResult;
    
    // Ensure no negative values
    customerAllocation = Math.max(0, customerAllocation);
    communityAllocation = Math.max(0, communityAllocation);
    
    // Constraint: Total allocated must not exceed available
    if (customerAllocation + communityAllocation > available) {
        // If AI hallucinated and exceeded available, apply a deterministic fix:
        // Prioritize community up to capacity/demand, rest to customers
        communityAllocation = Math.min(communityDemand, communityCapacity, available);
        customerAllocation = available - communityAllocation;
    }
    
    // Constraint: Community allocation must not exceed capacity
    if (communityAllocation > communityCapacity) {
        communityAllocation = communityCapacity;
        // Shift remaining to customer if available
        customerAllocation = Math.min(customerDemand, available - communityAllocation);
    }
    
    return {
        customerAllocation,
        communityAllocation,
        explanation: aiResult.explanation || 'Determined using deterministic validation.'
    };
};

module.exports = {
    allocateBatch
};
