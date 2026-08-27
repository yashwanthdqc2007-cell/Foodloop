// safetyEngine.js
// Deterministic rules engine to check food eligibility.

/**
 * Evaluates food handling conditions to determine eligibility for the platform.
 * Note: This is a decision-support demo engine, not a scientific safety certifier.
 */
const evaluateEligibility = (batchInfo) => {
    const { preparedAt, storageMethod, temperature, category } = batchInfo;
    const now = new Date();
    const preparedTime = new Date(preparedAt);
    const hoursSincePrepared = (now - preparedTime) / (1000 * 60 * 60);

    let status = 'ELIGIBLE';
    let handlingDeadline = new Date(preparedTime);
    let reason = 'Eligible according to configured handling rules.';

    // Demo rules
    if (storageMethod === 'HOT_HELD') {
        if (temperature < 60) {
            status = 'BLOCKED';
            reason = 'Hot-held food temperature below safe threshold (60°C).';
            handlingDeadline = new Date(now.getTime() - 1000); // Expired
        } else {
            // Hot held food can be kept for up to 4 hours
            handlingDeadline.setHours(handlingDeadline.getHours() + 4);
        }
    } else if (storageMethod === 'COLD_HELD') {
        if (temperature > 5) {
            status = 'BLOCKED';
            reason = 'Cold-held food temperature above safe threshold (5°C).';
            handlingDeadline = new Date(now.getTime() - 1000);
        } else {
            // Cold held food can be kept for up to 24 hours
            handlingDeadline.setHours(handlingDeadline.getHours() + 24);
        }
    } else if (storageMethod === 'ROOM_TEMP') {
        if (category === 'BAKERY') {
             // Bakery items can last up to 48 hours
             handlingDeadline.setHours(handlingDeadline.getHours() + 48);
        } else {
             // Prepared meals at room temp can only last 2 hours max
             handlingDeadline.setHours(handlingDeadline.getHours() + 2);
             if (hoursSincePrepared > 2) {
                 status = 'BLOCKED';
                 reason = 'Room temperature storage exceeded 2 hours.';
                 handlingDeadline = new Date(now.getTime() - 1000);
             } else if (hoursSincePrepared > 1.5) {
                 status = 'URGENT';
                 reason = 'Approaching handling deadline.';
             }
        }
    }

    if (now > handlingDeadline) {
        status = 'BLOCKED';
        reason = 'Handling deadline expired.';
    }

    return {
        status,
        reason,
        handlingDeadline: handlingDeadline.toISOString()
    };
};

module.exports = {
    evaluateEligibility
};
