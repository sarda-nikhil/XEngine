function makeLabelCanvas(specs) {

    const scale = 3;
    const { baseWidth, size, borderSize = 5 } = specs;
    const ctx = document.createElement('canvas').getContext('2d');
    const font = `${size * scale}px bold sans-serif`;
    ctx.font = font;

    const doubleBorderSize = borderSize * 2;
    const clientWidth = baseWidth + doubleBorderSize;
    const clientHeight = size + doubleBorderSize;
    const width = clientWidth * scale;
    const height = clientHeight * scale;

    ctx.canvas.style.width = `${clientWidth}px`;
    ctx.canvas.style.height = `${clientHeight}px`;
    ctx.canvas.width = width
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    return {
        context: ctx,
        canvas: ctx.canvas,
        baseWidth: baseWidth * scale, size: size * scale,
        width, height, clientWidth, clientHeight
    };

}

export { makeLabelCanvas };