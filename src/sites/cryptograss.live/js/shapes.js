// NES color palette as an object
export const nesPalette = {
    grey: '#7C7C7C',
    blue: '#0000FC',
    darkBlue: '#0000BC',
    purple: '#4428BC',
    darkPurple: '#940084',
    red: '#A80020',
    orange: '#A81000',
    brown: '#881400',
    darkBrown: '#503000',
    green: '#007800',
    darkGreen: '#006800',
    darkerGreen: '#005800',
    teal: '#004058',
    black: '#000000',
    lightGrey: '#BCBCBC',
    lightBlue: '#0078F8',
    skyBlue: '#0058F8',
    violet: '#6844FC',
    pink: '#D800CC',
    hotPink: '#E40058',
    lightRed: '#F83800',
    peach: '#E45C10',
    gold: '#AC7C00',
    lightGreen: '#00B800',
    neonGreen: '#00A800',
    aquaGreen: '#00A844',
    cyan: '#008888',
    white: '#F8F8F8',
    lightCyan: '#3CBCFC',
    babyBlue: '#6888FC',
    lavender: '#9878F8',
    magenta: '#F878F8',
    rose: '#F85898',
    salmon: '#F87858',
    tangerine: '#FCA044',
    yellow: '#F8B800',
    lime: '#B8F818',
    mint: '#58D854',
    paleGreen: '#58F898',
    turquoise: '#00E8D8',
    greyBlue: '#787878',
    brightWhite: '#FCFCFC',
    powderBlue: '#A4E4FC',
    lightLavender: '#B8B8F8',
    pastelPurple: '#D8B8F8',
    palePink: '#F8B8F8',
    blush: '#F8A4C0',
    ivory: '#F0D0B0',
    cream: '#FCE0A8',
    lightYellow: '#F8D878',
    lemon: '#D8F878',
    paleMint: '#B8F8B8',
    softTurquoise: '#B8F8D8',
    electricBlue: '#00FCFC',
    lightRose: '#F8D8F8'
};


// Example highlight color
const backgroundColor = nesPalette.white;  // Example background color

// Convert hex color to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Blend two colors
function blendColors(color1, color2, blendFactor) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    const r = Math.round(rgb1[0] * (1 - blendFactor) + rgb2[0] * blendFactor);
    const g = Math.round(rgb1[1] * (1 - blendFactor) + rgb2[1] * blendFactor);
    const b = Math.round(rgb1[2] * (1 - blendFactor) + rgb2[2] * blendFactor);
    return `rgb(${r},${g},${b})`;
}


// Generate diamond pattern
export function generateDiamondPattern(baseColor, shadowColor, highlightColor, backgroundColor, renderingAreaId) {
    // Create a new canvas element in the shapeRenderingArea div
    // const  = nesPalette.brightWhite;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    // Define the size of the pixel art
    const pixelSize = 5;
    const width = canvas.width / pixelSize;
    const height = canvas.height / pixelSize;
    const ctx = canvas.getContext('2d');
    document.getElementById(renderingAreaId).appendChild(canvas);

    // Define the size of the diamond
    const diamondSize = 20; // Adjust this value to change the diamond size
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Calculate the offset positions
            const offsetX = Math.abs(x - centerX);
            const offsetY = Math.abs(y - centerY);
            const distanceFromCenter = offsetX + offsetY;

            // Set the base color for the diamond
            let color = backgroundColor;

            if (distanceFromCenter < diamondSize) {
                const blendFactor = (diamondSize - distanceFromCenter) / diamondSize;
                // Add highlight on the top-left and bottom-right
                if ((x + y) % (2 * diamondSize) < diamondSize) {
                    color = blendColors(baseColor, highlightColor, blendFactor);
                }
                // Add shadow on the bottom-left and top-right
                else {
                    color = blendColors(baseColor, shadowColor, blendFactor);
                }
            }

            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
    }
}

const numberColors = {
    background: nesPalette.white,
    foreground: nesPalette.orange
};

// Pixel art for numbers 0-9 using an 8x8 grid
const numbers = [
    [
        "00111100",
        "01000010",
        "01000110",
        "01001010",
        "01010010",
        "01100010",
        "01000010",
        "00111100"
    ],
    [
        "00011000",
        "00111000",
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00011000",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "00000010",
        "00000100",
        "00001000",
        "00010000",
        "00100000",
        "01111110"
    ],
    [
        "00111100",
        "01000010",
        "00000010",
        "00011100",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ],
    [
        "00000100",
        "00001100",
        "00010100",
        "00100100",
        "01000100",
        "01111110",
        "00000100",
        "00000100"
    ],
    [
        "01111110",
        "01000000",
        "01000000",
        "01111100",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "01000000",
        "01111100",
        "01000010",
        "01000010",
        "01000010",
        "00111100"
    ],
    [
        "01111110",
        "00000010",
        "00000100",
        "00001000",
        "00010000",
        "00100000",
        "00100000",
        "00100000"
    ],
    [
        "00111100",
        "01000010",
        "01000010",
        "00111100",
        "01000010",
        "01000010",
        "01000010",
        "00111100"
    ],
    [
        "00111100",
        "01000010",
        "01000010",
        "00111110",
        "00000010",
        "00000010",
        "01000010",
        "00111100"
    ]
];

function drawNumber(number, canvas_on_which_to_draw) {

    const pixelSize = 30;
    // TODO: Can we nix these two lines?
    const startY = 0;
    const startX = 0;

    console.log('Drawing number', number);
    const pattern = numbers[number];

    let ctx = canvas_on_which_to_draw.getContext('2d');
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            ctx.fillStyle = pattern[y][x] === '1' ? numberColors.foreground : numberColors.background;
            ctx.fillRect((startX + x) * pixelSize, (startY + y) * pixelSize, pixelSize, pixelSize);
        }
    }
}

// Find canvas elements with class "pixel-number" and draw the number indicated in their data attribute
const pixelNumbers = document.querySelectorAll('.pixel-number');
pixelNumbers.forEach((numberCanvas) => {
    const number = parseInt(numberCanvas.dataset.number);
    const x = parseInt(numberCanvas.dataset.x);
    const y = parseInt(numberCanvas.dataset.y);
    drawNumber(number, numberCanvas);
});


document.addEventListener("DOMContentLoaded", function () {
    const rows = document.querySelectorAll('.row.drawNumberHere');

    rows.forEach((row, index) => {
        console.log("Processing row.")
        const img = row.querySelector('img');
        const canvas = row.querySelector('canvas');
        const combinedCanvas = document.createElement('canvas');
        const combinedCtx = combinedCanvas.getContext('2d');
        const imgElement = new Image();
        imgElement.src = img.src;

        imgElement.onload = () => {
            // Set the size of the combined canvas
            combinedCanvas.width = imgElement.width;
            combinedCanvas.height = imgElement.height;

            // Draw the image onto the combined canvas
            combinedCtx.drawImage(imgElement, 0, 0);

            // Draw the existing canvas onto the combined canvas
            combinedCtx.drawImage(canvas, 0, 0);

            // Assuming you want to draw something on the canvas
            // Add your canvas drawing code here

            // Convert to PNG
            const pngDataUrl = combinedCanvas.toDataURL("image/png");

            // Create a link element to download the image
            const link = document.createElement('a');
            link.href = pngDataUrl;
            link.id = `download-link-${index + 1}`;
            link.download = `pair_${index + 1}.png`;
            link.textContent = `Download pair ${index + 1} as PNG`;
            // Create a button element for the link
            const button = document.createElement('button');
            button.textContent = `Download pair ${index + 1} as PNG`;
            button.className = 'btn btn-primary';

            // Append the button to the link
            link.appendChild(button);

            document.body.appendChild(link);
        };
    });
});

