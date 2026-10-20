import { useEffect, useState } from 'react';

// Tema claro/escuro/sistema: o ds/bononi-tema.js (cópia do Hub, carregado síncrono no
// <head>) aplica <html data-theme> e dispara 'tema-mudou'. Este hook só deixa o React
// reagir ao mesmo evento (sonner, qualquer cor lida em JS).
export function useTemaEfetivo(): 'light' | 'dark' {
  const ler = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  const [tema, setTema] = useState<'light' | 'dark'>(ler);
  useEffect(() => {
    const h = () => setTema(ler());
    document.addEventListener('tema-mudou', h);
    return () => document.removeEventListener('tema-mudou', h);
  }, []);
  return tema;
}
