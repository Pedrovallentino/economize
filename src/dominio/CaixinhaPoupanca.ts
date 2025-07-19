/**
 * Enum para tipos de movimentação em caixinhas
 */
export enum TipoMovimentacaoCaixinha {
  DEPOSITO = 'deposito',
  SAQUE = 'saque'
}

/**
 * Interface para representar uma entrada no histórico
 */
export interface HistoricoCaixinha {
  id: string;
  caixinhaId: string;
  tipo: TipoMovimentacaoCaixinha;
  valor: number;
  saldoAnterior: number;
  saldoNovo: number;
  descricao?: string;
  createdAt: Date;
}

/**
 * Classe de domínio para representar uma Caixinha de Poupança
 * Contém a lógica de negócio relacionada às caixinhas de poupança
 */
export class CaixinhaPoupanca {
  public readonly id: string;
  public nome: string;
  public saldo: number;
  public descricao?: string;
  public readonly usuarioId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    nome: string,
    saldo: number,
    usuarioId: string,
    createdAt: Date,
    updatedAt: Date,
    descricao?: string
  ) {
    this.id = id;
    this.nome = nome;
    this.saldo = saldo;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.descricao = descricao;
  }

  /**
   * Deposita valor na caixinha
   * @param valor - Valor a ser depositado
   * @returns Dados para registrar no histórico
   * @throws Error se o valor for negativo ou zero
   */
  depositar(valor: number): HistoricoCaixinha {
    if (valor <= 0) {
      throw new Error('O valor do depósito deve ser positivo');
    }

    const saldoAnterior = this.saldo;
    this.saldo += valor;

    return {
      id: '', // Será gerado pelo banco
      caixinhaId: this.id,
      tipo: TipoMovimentacaoCaixinha.DEPOSITO,
      valor,
      saldoAnterior,
      saldoNovo: this.saldo,
      createdAt: new Date()
    };
  }

  /**
   * Saca valor da caixinha
   * @param valor - Valor a ser sacado
   * @returns Dados para registrar no histórico
   * @throws Error se o valor for maior que o saldo ou negativo
   */
  sacar(valor: number): HistoricoCaixinha {
    if (valor <= 0) {
      throw new Error('O valor do saque deve ser positivo');
    }
    if (valor > this.saldo) {
      throw new Error('Saldo insuficiente para realizar o saque');
    }

    const saldoAnterior = this.saldo;
    this.saldo -= valor;

    return {
      id: '', // Será gerado pelo banco
      caixinhaId: this.id,
      tipo: TipoMovimentacaoCaixinha.SAQUE,
      valor,
      saldoAnterior,
      saldoNovo: this.saldo,
      createdAt: new Date()
    };
  }

  /**
   * Valida se o nome da caixinha é válido
   * @param nome - Nome a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarNome(nome: string): boolean {
    return nome.trim().length >= 2 && nome.trim().length <= 50;
  }

  /**
   * Valida se o valor é válido para operações
   * @param valor - Valor a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarValor(valor: number): boolean {
    return valor > 0 && valor <= 999999.99;
  }

  /**
   * Formata o saldo para exibição
   * @returns Saldo formatado em reais
   */
  formatarSaldo(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.saldo);
  }

  /**
   * Calcula a evolução do saldo com base no histórico
   * @param historico - Array de entradas do histórico
   * @returns Dados para gráfico de evolução
   */
  calcularEvolucaoSaldo(historico: HistoricoCaixinha[]): Array<{data: string, saldo: number}> {
    const evolucao = [
      {
        data: this.createdAt.toISOString().split('T')[0],
        saldo: 0
      }
    ];

    historico
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .forEach(entrada => {
        evolucao.push({
          data: entrada.createdAt.toISOString().split('T')[0],
          saldo: entrada.saldoNovo
        });
      });

    return evolucao;
  }

  /**
   * Calcula estatísticas da caixinha
   * @param historico - Array de entradas do histórico
   * @returns Estatísticas da caixinha
   */
  calcularEstatisticas(historico: HistoricoCaixinha[]): {
    totalDepositos: number;
    totalSaques: number;
    numeroDepositos: number;
    numeroSaques: number;
    mediaDepositos: number;
    mediaSaques: number;
  } {
    const depositos = historico.filter(h => h.tipo === TipoMovimentacaoCaixinha.DEPOSITO);
    const saques = historico.filter(h => h.tipo === TipoMovimentacaoCaixinha.SAQUE);

    const totalDepositos = depositos.reduce((sum, d) => sum + d.valor, 0);
    const totalSaques = saques.reduce((sum, s) => sum + s.valor, 0);

    return {
      totalDepositos,
      totalSaques,
      numeroDepositos: depositos.length,
      numeroSaques: saques.length,
      mediaDepositos: depositos.length ? totalDepositos / depositos.length : 0,
      mediaSaques: saques.length ? totalSaques / saques.length : 0
    };
  }
}