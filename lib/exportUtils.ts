// Client-side export helpers: SVG (raw markup), PNG (rasterised at scale),
// and PDF (single page preserving aspect ratio).

import { saveAs } from "file-saver";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}

function serializeSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = svg.getAttribute("viewBox")?.split(" ") ?? ["0", "0", "0", "0"];
  clone.setAttribute("width", vb[2]);
  clone.setAttribute("height", vb[3]);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    new XMLSerializer().serializeToString(clone);
}

export function exportSvg(svg: SVGSVGElement) {
  const blob = new Blob([serializeSvg(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  saveAs(blob, `inkform-${timestamp()}.svg`);
}

// html-to-image renders the live DOM (incl. loaded webfont) reliably across
// browsers, so we rasterise the wrapper element rather than the raw SVG.
export async function rasterize(
  node: HTMLElement,
  width: number,
  height: number,
  scale: number,
  background: string | undefined
): Promise<string> {
  return toPng(node, {
    pixelRatio: 1,
    canvasWidth: width * scale,
    canvasHeight: height * scale,
    backgroundColor: background,
    cacheBust: true,
  });
}

export async function exportPng(
  node: HTMLElement,
  width: number,
  height: number,
  scale: number,
  background?: string
) {
  const url = await rasterize(node, width, height, scale, background);
  saveAs(url, `inkform-${timestamp()}@${scale}x.png`);
}

export async function exportPdf(
  node: HTMLElement,
  width: number,
  height: number,
  background?: string
) {
  const url = await rasterize(node, width, height, 3, background);
  const orientation = width >= height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "pt",
    format: [width, height],
  });
  pdf.addImage(url, "PNG", 0, 0, width, height);
  pdf.save(`inkform-${timestamp()}.pdf`);
}
