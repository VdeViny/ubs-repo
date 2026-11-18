import { TestBed } from '@angular/core/testing';
import { TemaService, TEMAS } from './tema.service';

describe('TemaService', () => {
  let service: TemaService;

  beforeEach(() => {
    localStorage.removeItem('ubs-tema');
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemaService);
  });

  it('os dois temas têm as mesmas variáveis no mapa', () => {
    const claro = [...TEMAS.get('claro')!.keys()].sort();
    const escuro = [...TEMAS.get('escuro')!.keys()].sort();
    expect(escuro).toEqual(claro);
  });

  it('aplica as cores do mapa no <html>', () => {
    service.aplicar('escuro');
    const raiz = document.documentElement;
    TEMAS.get('escuro')!.forEach((valor, variavel) => {
      expect(raiz.style.getPropertyValue(variavel)).toBe(valor);
    });
    expect(raiz.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('alternar troca entre claro e escuro e lembra a escolha', () => {
    service.aplicar('claro');
    service.alternar();
    expect(service.atual()).toBe('escuro');
    expect(localStorage.getItem('ubs-tema')).toBe('escuro');
    service.alternar();
    expect(service.atual()).toBe('claro');
  });
});
