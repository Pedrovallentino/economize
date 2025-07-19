/**
 * Enums para tipos e frequências de movimentação
 */
export enum TipoMovimentacao {
  RECEITA = 'receita',
  DESPESA = 'despesa'
}

export enum FrequenciaMovimentacao {
  AVULSA = 'avulsa',
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal'
}

/**
 * Classe de domínio para representar uma Movimentação Financeira
 * Contém a lógica de negócio relacionada às movimentações
 */
export class Movimentacao {
  public readonly id: string;
  public nome: string;
  public valor: number;
  public tipo: TipoMovimentacao;
  public frequencia: FrequenciaMovimentacao;
  public dataVencimento: Date;
  public descricao?: string;
  public ativa: boolean;
  public readonly carteiraId: string;
  public readonly usuarioId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    nome: string,
    valor: number,
    tipo: TipoMovimentacao,
    frequencia: FrequenciaMovimentacao,
    dataVencimento: Date,
    carteiraId: string,
    usuarioId: string,
    createdAt: Date,
    updatedAt: Date,
    ativa: boolean = true,
    descricao?: string
  ) {
    this.id = id;
    this.nome = nome;
    this.valor = valor;
    this.tipo = tipo;
    this.frequencia = frequencia;
    this.dataVencimento = dataVencimento;
    this.carteiraId = carteiraId;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.ativa = ativa;
    this.descricao = descricao;
  }

  /**
   * Valida se o valor da movimentação é válido
   * @param valor - Valor a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarValor(valor: number): boolean {
    return valor > 0 && valor <= 999999.99;
  }

  /**
   * Valida se o nome da movimentação é válido
   * @param nome - Nome a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarNome(nome: string): boolean {
    return nome.trim().length >= 2 && nome.trim().length <= 100;
  }

  /**
   * Ativa a movimentação
   */
  ativar(): void {
    this.ativa = true;
  }

  /**
   * Desativa a movimentação
   */
  desativar(): void {
    this.ativa = false;
  }

  /**
   * Verifica se a movimentação está vencida
   * @returns true se vencida, false caso contrário
   */
  estaVencida(): boolean {
    return this.dataVencimento < new Date();
  }

  /**
   * Calcula a próxima data de vencimento baseada na frequência
   * @returns Nova data de vencimento
   */
  calcularProximoVencimento(): Date {
    const proximaData = new Date(this.dataVencimento);
    
    switch (this.frequencia) {
      case FrequenciaMovimentacao.SEMANAL:
        proximaData.setDate(proximaData.getDate() + 7);
        break;
      case FrequenciaMovimentacao.QUINZENAL:
        proximaData.setDate(proximaData.getDate() + 15);
        break;
      case FrequenciaMovimentacao.MENSAL:
        proximaData.setMonth(proximaData.getMonth() + 1);
        break;
      default:
        // Para movimentações avulsas, não há próximo vencimento
        break;
    }
    
    return proximaData;
  }

  /**
   * Formata o valor para exibição
   * @returns Valor formatado em reais
   */
  formatarValor(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.valor);
  }

  /**
   * Retorna a cor associada ao tipo de movimentação
   * @returns Cor em formato de classe CSS
   */
  obterCorTipo(): string {
    return this.tipo === TipoMovimentacao.RECEITA ? 'text-green-600' : 'text-red-600';
  }
}