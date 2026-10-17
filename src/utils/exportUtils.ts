import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadElementAsPNG(elementId: string, filename: string): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    alert(`Élément #${elementId} introuvable.`);
    return;
  }

  const originalShadow = el.style.boxShadow;
  el.style.boxShadow = 'none';

  try {
    const canvas = await html2canvas(el, {
      scale: 2.2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    
    el.style.boxShadow = originalShadow;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      saveAs(blob, `${filename}.png`);
    }
  } catch (err) {
    el.style.boxShadow = originalShadow;
    console.error('Erreur export image PNG:', err);
    alert('Une erreur est survenue lors de la capture de l\'image.');
  }
}

export interface ExportZipTabItem {
  id: string;
  tabLabel: string;
}

export async function downloadDossierZIP(
  tabs: ExportZipTabItem[],
  clientName: string,
  switchTabFn: (tabId: string) => Promise<void> | void
): Promise<void> {
  const zip = new JSZip();
  const cleanClient = (clientName || 'Client').trim().replace(/[\\/:*?"<>|]/g, '_') || 'Client';

  try {
    for (const item of tabs) {
      await switchTabFn(item.id);
      // Wait for rendering
      await new Promise(r => setTimeout(r, 120));

      const el = document.getElementById(item.id);
      if (!el) continue;

      const canvas = await html2canvas(el, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const filename = `NASAQ - ${item.tabLabel} - ${cleanClient}.png`;
      zip.file(filename, base64Data, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `NASAQ - Dossier Complet - ${cleanClient}.zip`);
  } catch (err) {
    console.error('Erreur export ZIP:', err);
    alert('Une erreur est survenue lors de la création du fichier ZIP.');
  }
}
