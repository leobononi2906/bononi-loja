// Módulo Tacógrafo — geração de PDFs (declaração de residência + dossiê)
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

const A4: [number, number] = [595.28, 841.89];
const PRETO = rgb(0, 0, 0);

// ─── SANITIZAÇÃO PARA WinAnsi (Helvetica) ────────────────────────────────
// pdf-lib com StandardFonts só aceita WinAnsi (Windows-1252).
// Dados do ERP podem conter 0xFFFD (replacement char) ou encoding duplo.
function sanitize(text: string): string {
  if (!text) return "";
  let s = text;
  // Remove Unicode replacement character e null
  s = s.replace(/\uFFFD/g, "");
  s = s.replace(/\u0000/g, "");
  // Remove qualquer caractere fora do range WinAnsi
  // Aceita: 0x20-0x7E (ASCII) + 0xA0-0xFF (Latin-1 Supplement com acentos PT)
  s = s.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, (ch) => {
    const code = ch.charCodeAt(0);
    if (code === 0x2013 || code === 0x2014) return "-";
    if (code === 0x2018 || code === 0x2019) return "'";
    if (code === 0x201C || code === 0x201D) return '"';
    if (code === 0x2026) return "...";
    return "";
  });
  return s.trim();
}

// Sanitiza todos os campos de um objeto (só strings)
function sanitizeAll<T extends Record<string, string>>(raw: T): T {
  const out = { ...raw };
  for (const key of Object.keys(out) as (keyof T)[]) {
    if (typeof out[key] === "string") {
      (out as Record<string, string>)[key as string] = sanitize(out[key] as string);
    }
  }
  return out;
}

// ─── DECLARAÇÃO DE RESIDÊNCIA ─────────────────────────────────────────────

export interface DeclaracaoDados {
  nome: string;
  cpf: string;
  rg: string;
  placa: string;
  renavam: string;
  endereco: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  cidadeAssinatura: string;
  data: string; // dd/mm/aaaa
}

interface Tok {
  t: string;
  b?: boolean;
}

function wrapTokens(
  toks: Tok[],
  fontR: PDFFont,
  fontB: PDFFont,
  size: number,
  maxW: number
): Tok[][] {
  const words: Tok[] = [];
  toks.forEach(({ t, b }) => {
    t.split(/(\s+)/).forEach((w) => {
      if (w) words.push({ t: w, b });
    });
  });
  const lines: Tok[][] = [];
  let line: Tok[] = [];
  let w = 0;
  const width = (tk: Tok) => (tk.b ? fontB : fontR).widthOfTextAtSize(tk.t, size);
  for (const tk of words) {
    const isSpace = tk.t.trim() === "";
    if (line.length === 0 && isSpace) continue;
    const tw = width(tk);
    if (w + tw > maxW && line.length > 0 && !isSpace) {
      lines.push(line);
      line = [];
      w = 0;
    }
    if (line.length === 0 && isSpace) continue;
    line.push(tk);
    w += tw;
  }
  if (line.length) lines.push(line);
  return lines;
}

function drawRich(
  page: PDFPage,
  toks: Tok[],
  x: number,
  y: number,
  maxW: number,
  size: number,
  fontR: PDFFont,
  fontB: PDFFont,
  lh: number
): number {
  const lines = wrapTokens(toks, fontR, fontB, size, maxW);
  for (const line of lines) {
    let cx = x;
    for (const tk of line) {
      const f = tk.b ? fontB : fontR;
      page.drawText(tk.t, { x: cx, y, size, font: f, color: PRETO });
      cx += f.widthOfTextAtSize(tk.t, size);
    }
    y -= lh;
  }
  return y;
}

export async function gerarDeclaracaoPdf(raw: DeclaracaoDados): Promise<Uint8Array> {
  // Sanitizar todos os campos dinâmicos (dados do ERP podem ter lixo)
  const d = sanitizeAll(raw);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage(A4);
  const fontR = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontI = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const [W, H] = A4;
  const ML = 70;
  const MR = 70;
  const maxW = W - ML - MR;
  let y = H - 100;

  const titulo = sanitize("DECLARA\u00C7\u00C3O DE RESID\u00CANCIA PESSOA F\u00CDSICA - PROPRIET\u00C1RIO");
  const tSize = 12.5;
  page.drawText(titulo, { x: ML, y, size: tSize, font: fontB, color: PRETO });
  const tw = fontB.widthOfTextAtSize(titulo, tSize);
  page.drawLine({
    start: { x: ML, y: y - 3 },
    end: { x: ML + tw, y: y - 3 },
    thickness: 1,
    color: PRETO,
  });
  y -= 60;

  const up = (s: string) => sanitize(s || "").toUpperCase().trim();

  const corpo: Tok[] = [
    { t: "Eu, " },
    { t: up(d.nome), b: true },
    { t: ", propriet\u00E1rio do ve\u00EDculo placa " },
    { t: up(d.placa), b: true },
    { t: ", renavam " },
    { t: d.renavam || "____________", b: true },
    { t: ", portador (a) do CPF n\u00BA " },
    { t: d.cpf || "____________", b: true },
    { t: ", R.G. n\u00BA " },
    { t: d.rg || "____________", b: true },
    { t: ", " },
    { t: "DECLARO", b: true },
    {
      t: " para os devidos fins de comprova\u00E7\u00E3o de resid\u00EAncia, sob as penas da Lei (art. 2\u00BA da Lei 7.115/83), e atendimento ao subitem 9.3.4 do RTM aprovados pelos artigos 1\u00BA e 2\u00BA da Portaria Inmetro 535 de 26 de dezembro de 2019, que sou residente \u00E0 ",
    },
    { t: `${up(d.endereco)}, ${d.numero || "S/N"}`, b: true },
    { t: ", bairro " },
    { t: up(d.bairro), b: true },
    { t: ", CEP " },
    { t: d.cep || "____________", b: true },
    { t: ", no munic\u00EDpio de " },
    { t: up(d.cidade), b: true },
    { t: ", estado do " },
    { t: up(d.uf) + ".", b: true },
  ];
  y = drawRich(page, corpo, ML, y, maxW, 11.5, fontR, fontB, 22);
  y -= 22;

  page.drawText(`Telefone: ${d.telefone || ""}`, { x: ML, y, size: 11.5, font: fontR, color: PRETO });
  y -= 22;
  page.drawText(`E-mail: ${d.email || ""}`, { x: ML, y, size: 11.5, font: fontR, color: PRETO });
  y -= 40;

  y = drawRich(
    page,
    [
      { t: "Declaro ainda, estar ciente de que declara\u00E7\u00E3o falsa pode implicar na san\u00E7\u00E3o penal prevista no art. 299 do C\u00F3digo Penal, " },
      { t: "in verbis:" },
    ],
    ML,
    y,
    maxW,
    11.5,
    fontR,
    fontB,
    22
  );
  y -= 10;

  const cit =
    '"Art. 299 \u2013 Omitir, em documento p\u00FAblico ou particular, declara\u00E7\u00E3o que nele deveria constar, ou nele inserir ou fazer inserir declara\u00E7\u00E3o falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obriga\u00E7\u00E3o ou alterar a verdade sobre o fato juridicamente relevante. Pena: reclus\u00E3o de 1 (um) a 5 (cinco) anos e multa, se o documento \u00E9 p\u00FAblico e reclus\u00E3o de 1 (um) a 3 (tr\u00EAs) anos, se o documento \u00E9 particular."';
  const citX = ML + 90;
  const citW = maxW - 90;
  const citSafe = sanitize(cit);
  const citLines = wrapTokens([{ t: citSafe }], fontI, fontI, 9.5, citW);
  for (const line of citLines) {
    let cx = citX;
    for (const tk of line) {
      page.drawText(tk.t, { x: cx, y, size: 9.5, font: fontI, color: PRETO });
      cx += fontI.widthOfTextAtSize(tk.t, 9.5);
    }
    y -= 14;
  }
  y -= 45;

  const localData = `${up(d.cidadeAssinatura)}, ${d.data}.`;
  const ldW = fontR.widthOfTextAtSize(localData, 11.5);
  page.drawText(localData, { x: (W - ldW) / 2, y, size: 11.5, font: fontR, color: PRETO });
  y -= 80;

  const assW = 280;
  page.drawLine({
    start: { x: (W - assW) / 2, y },
    end: { x: (W + assW) / 2, y },
    thickness: 0.8,
    color: PRETO,
  });
  y -= 16;
  const assTxt = "Assinatura do declarante";
  const atW = fontR.widthOfTextAtSize(assTxt, 10);
  page.drawText(assTxt, { x: (W - atW) / 2, y, size: 10, font: fontR, color: PRETO });

  const rodape = sanitize(
    "Subitem 9.3.4 do RTM aprovados pelos artigos 1\u00BA e 2\u00BA da Portaria Inmetro 935, item 9.3.4 Para a execu\u00E7\u00E3o do servi\u00E7o, o ve\u00EDculo dever\u00E1 ser apresentado com documento que lhe permita circular em tr\u00E2nsito, expedido por \u00F3rg\u00E3o competente, juntamente com comprovante de resid\u00EAncia do propriet\u00E1rio ou declara\u00E7\u00E3o de moradia."
  );
  let ry = 90;
  const rLines = wrapTokens([{ t: rodape }], fontR, fontB, 8.5, maxW);
  for (const line of rLines) {
    let cx = ML;
    for (const tk of line) {
      page.drawText(tk.t, { x: cx, y: ry, size: 8.5, font: fontR, color: PRETO });
      cx += fontR.widthOfTextAtSize(tk.t, 8.5);
    }
    ry -= 12;
  }

  return pdf.save();
}

// ─── DOSSIÊ COMPILADO ─────────────────────────────────────────────────────

export interface DossieItem {
  tipo: string;
  url: string;
  mime: string | null;
  nome?: string | null;
}

export async function gerarDossiePdf(itens: DossieItem[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const [W, H] = A4;
  const margin = 24;
  const slotH = (H - margin * 3) / 2;
  const slotW = W - margin * 2;

  let page: PDFPage | null = null;
  let slot: 0 | 1 = 0;

  for (const item of itens) {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error(`Falha ao baixar anexo ${item.tipo} (${res.status})`);
    const buf = await res.arrayBuffer();

    const isPdf =
      (item.mime || "").toLowerCase().includes("pdf") ||
      (item.nome || "").toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = await pdf.copyPages(src, src.getPageIndices());
      pages.forEach((p) => pdf.addPage(p));
      page = null;
      slot = 0;
      continue;
    }

    let img;
    try {
      img = await pdf.embedJpg(buf);
    } catch {
      img = await pdf.embedPng(buf);
    }

    if (!page) {
      page = pdf.addPage(A4);
      slot = 0;
    }

    const scale = Math.min(slotW / img.width, slotH / img.height, 1.5);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (W - w) / 2;
    const regiaoBaseY = slot === 0 ? H - margin - slotH : margin;
    const y = regiaoBaseY + (slotH - h) / 2;
    page.drawImage(img, { x, y, width: w, height: h });

    if (slot === 0) slot = 1;
    else page = null;
  }

  return pdf.save();
}

// ─── ABRIR / BAIXAR PDF ───────────────────────────────────────────────────

export function abrirPdf(bytes: Uint8Array, nomeArquivo: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
