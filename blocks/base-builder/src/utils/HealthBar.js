export function drawHealthBar(context, x, y, totalWidth, health, maxHealth, height = 4){
    const healthPercent = Math.max(0, Math.min(health / maxHealth, 1));
    // Background
    context.fillStyle = '#333';
    context.fillRect(x, y, totalWidth, height);

    // Color based on percentage
    let color = '#2ecc71'; // green
    if (healthPercent < 0.3) color = '#e74c3c'; // red
    else if (healthPercent < 0.6) color = '#f39c12'; // orange

    context.fillStyle = color;
    context.fillRect(x, y, totalWidth * healthPercent, height);
} 