import { Injectable, signal } from '@angular/core';

/** Nomes dos temas disponíveis na aplicação. */
export type NomeTema = 'claro' | 'escuro';

/**
 * Paleta de um tema: um MAPA de "variável CSS" -> "valor da cor".
 * Ex.: '--cse-bg' -> '#ffffff'
 */
export type PaletaTema = Map<string, string>;

/**
 * Estrutura de dados escolhida: MAPA (Map).
 *
 * TEMAS é um mapa de mapas:
 *   chave  = nome do tema ('claro' | 'escuro')
 *   valor  = outro mapa com as variáveis CSS daquele tema
 *
 * Por que Mapa?
 *  - O acesso é por chave (o nome do tema), em tempo O(1): TEMAS.get('escuro').
 *  - Não importa a ordem nem há prioridade entre os temas — não é caso de
 *    Fila, Pilha ou Árvore. Um Array obrigaria a procurar o tema percorrendo
 *    a lista (O(n)).
 *  - Para acrescentar um tema novo (ex.: 'alto-contraste') basta um novo
 *    TEMAS.set(...); nenhuma outra parte do código muda.
 *  - Os dois temas têm exatamente as mesmas chaves, então trocar de tema é
 *    só percorrer o mapa do tema escolhido e aplicar cada par chave/valor.
 */
export const TEMAS: ReadonlyMap<NomeTema, PaletaTema> = new Map<NomeTema, PaletaTema>([
  [
    'claro',
    new Map([
      ['--cse-bg', '#ffffff'],            // cabeçalho, rodapé, cartões
      ['--cse-page-bg', '#f8fdfc'],       // fundo da página
      ['--cse-surface', '#ffffff'],       // fundo de formulários
      ['--cse-input-bg', '#f9f9f9'],      // fundo dos campos
      ['--cse-text', '#004646'],          // texto principal
      ['--cse-text-muted', '#333333'],    // rótulos
      ['--cse-border', '#e5e7eb'],        // bordas
      ['--cse-sub-bg', '#eafaf1'],        // blocos de destaque
      ['--cse-logo-filter', 'none'],      // logo original
      ['--cse-logo-blend', 'normal'],
    ]),
  ],
  [
    'escuro',
    new Map([
      ['--cse-bg', '#16201f'],
      ['--cse-page-bg', '#0f1716'],
      ['--cse-surface', '#1b2726'],
      ['--cse-input-bg', '#22302f'],
      ['--cse-text', '#cdeeea'],
      ['--cse-text-muted', '#b8cfcc'],
      ['--cse-border', '#2f3f3d'],
      ['--cse-sub-bg', '#1f3a33'],
      // O logo é um PNG com fundo branco e texto cinza-escuro. Inverter as
      // cores deixa o fundo preto e o texto claro; girar o matiz 180° traz o
      // símbolo de volta para o verde-água, e o brilho compensa o verde que
      // a inversão escurece. O modo "screen" faz o preto sumir, mostrando o
      // fundo escuro do cabeçalho por trás.
      ['--cse-logo-filter', 'invert(1) hue-rotate(180deg) brightness(1.5)'],
      ['--cse-logo-blend', 'screen'],
    ]),
  ],
]);

const CHAVE_STORAGE = 'ubs-tema';

/**
 * Controla o modo claro/escuro da aplicação.
 *
 * Ao aplicar um tema:
 *  1. grava cada variável CSS do mapa no <html> (as telas usam var(--cse-...));
 *  2. ajusta `data-bs-theme`, que faz o Bootstrap trocar tabelas, modais e
 *     campos para o modo escuro;
 *  3. ajusta `color-scheme`, que faz o Angular Material trocar suas cores;
 *  4. guarda a escolha no navegador para a próxima visita.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  /** Tema atual, observado pela tela (botão de alternar). */
  readonly atual = signal<NomeTema>('claro');

  constructor() {
    this.aplicar(this.temaInicial());
  }

  /** Troca entre claro e escuro. */
  alternar(): void {
    this.aplicar(this.proximo());
  }

  private proximo(): NomeTema {
    return this.atual() === 'claro' ? 'escuro' : 'claro';
  }

  /** Aplica o tema pelo nome, buscando a paleta no mapa TEMAS. */
  aplicar(nome: NomeTema): void {
    const paleta = TEMAS.get(nome);
    if (!paleta) {
      return; // nome desconhecido: mantém o tema atual
    }

    const raiz = document.documentElement;
    paleta.forEach((valor, variavel) => raiz.style.setProperty(variavel, valor));
    raiz.setAttribute('data-bs-theme', nome === 'escuro' ? 'dark' : 'light');
    raiz.style.colorScheme = nome === 'escuro' ? 'dark' : 'light';

    this.atual.set(nome);
    try {
      localStorage.setItem(CHAVE_STORAGE, nome);
    } catch {
      // navegador sem localStorage (modo privado): só não lembra a escolha
    }
  }

  /** Escolha salva; se não houver, segue a preferência do sistema. */
  private temaInicial(): NomeTema {
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE) as NomeTema | null;
      if (salvo && TEMAS.has(salvo)) {
        return salvo;
      }
    } catch {
      // ignora: cai na preferência do sistema
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
}
