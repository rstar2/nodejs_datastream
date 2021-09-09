var fs = require('fs'),
  PDFDocument = require('pdfkit'),
  SVGtoPDF = require('svg-to-pdfkit');

var doc = new PDFDocument(),
  stream = fs.createWriteStream('file.pdf'),
  svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 540 320">
 <defs>
  <path id="Triangle" d="M120 20 L 220 193.205 L 20 193.205 Z" stroke="red" fill="url(#radial)"/>
  <path id="Maths" d="M250,50C380,50 350,150 480,150" stroke="green" fill="none"/>
  <path id="Chemistry" transform="translate(-200,0) scale(1.5)" d="M250,50C380,50 350,150 480,150" stroke="blue" fill="none"/>
  <path id="Path" d="M20,240 C40,280 60,280 200,230 A100 100 0 0 1 300,260 L 330,280 Q 400,320 500,200" stroke="orange" fill="none"/>
  <linearGradient id="linear" x1="0" x2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="green" offset="0"/>
    <stop stop-color="red" offset="1"/>
  </linearGradient>
  <radialGradient id="radial" cx="0.5" cy="0.6667" r="0.6" gradientUnits="objectBoundingBox">
    <stop stop-color="orange" offset="0.2"/>
    <stop stop-color="yellow" offset="1"/>
  </radialGradient>
  <pattern id="pattern" width="4" height="4" patternUnits="userSpaceOnUse">
    <rect width="4" height="4"/>
    <rect width="2" height="2" fill="red"/>
    <rect x="2" y="2" width="2" height="2" fill="red"/>
  </pattern>
 </defs>
 <rect x="2%" y="2%" width="96%" height="96%" fill="url(#linear)" fill-opacity="0.3" stroke="orange" stroke-width="2" stroke-dasharray="5 2 2 2 5 5"/>
 <use xlink:href="#Triangle"/>
 <use xlink:href="#Maths"/>
 <use xlink:href="#Chemistry"/>
 <use xlink:href="#Path"/>
 <text textLength="600px" lengthAdjust="spacingAndGlyphs" fill="url(#pattern)">
  <textPath xlink:href="#Triangle" font-size="20" font-family="serif" font-weight="bold" textLength="600px" lengthAdjust="spacingAndGlyphs">Text adjusted around a triangle</textPath>
 </text>
 <text font-family="sans-serif">
  <textPath xlink:href="#Maths" font-size="30" fill="blue" text-anchor="middle" startOffset="50%">Maths x<tspan font-size="20" baseline-shift="super">2</tspan> + y<tspan font-size="20" baseline-shift="super">2</tspan> = z<tspan font-size="20" baseline-shift="super">2</tspan>!</textPath>
  <textPath xlink:href="#Chemistry" font-size="30" fill="green" text-anchor="middle" startOffset="50%">Chemistry 2H<tspan font-size="20" baseline-shift="sub">2</tspan> + O<tspan font-size="20" baseline-shift="sub">2</tspan> -> 2H<tspan font-size="20" baseline-shift="sub">2</tspan>O</textPath>
  <textPath xlink:href="#Path" font-size="30" fill="purple" dominant-baseline="middle" text-anchor="middle" startOffset="50%">Text centered on a complex path</textPath>
 </text>
</svg>`;

SVGtoPDF(doc, svg, 0, 0);

doc.pipe(stream);
doc.end();
