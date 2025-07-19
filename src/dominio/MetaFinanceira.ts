/**
 * Classe de domínio para representar uma Meta Financeira
 * Contém a lógica de negócio relacionada às metas financeiras
 */
export class MetaFinanceira {
  public readonly id: string;
  public nome: string;
  public valorObjetivo: number;
  public valorAcumulado: number;
  public dataLimite: Date;
  public concluida: boolean;
  public descricao?: string;
  public readonly usuarioId: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    id: string,
    nome: string,
    valorObjetivo: number,
    valorAcumulado: number,
    dataLimite: Date,
    usuarioId: string,
    createdAt: Date,
    updatedAt: Date,
    concluida: boolean = false,
    descricao?: string
  ) {
    this.id = id;
    this.nome = nome;
    this.valorObjetivo = valorObjetivo;
    this.valorAcumulado = valorAcumulado;
    this.dataLimite = dataLimite;
    this.usuarioId = usuarioId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.concluida = concluida;
    this.descricao = descricao;
  }

  /**
   * Calcula o progresso da meta em percentual
   * @returns Percentual de progresso (0-100)
   */
  calcularProgresso(): number {
    if (this.valorObjetivo <= 0) return 0;
    const progresso = (this.valorAcumulado / this.valorObjetivo) * 100;
    return Math.min(progresso, 100);
  }

  /**
   * Deposita valor na meta
   * @param valor - Valor a ser depositado
   * @throws Error se o valor for negativo ou zero
   */
  depositar(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor do depósito deve ser positivo');
    }
    
    this.valorAcumulado += valor;
    this.verificarConclusao();
  }

  /**
   * Saca valor da meta
   * @param valor - Valor a ser sacado
   * @throws Error se o valor for maior que o acumulado ou negativo
   */
  sacar(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor do saque deve ser positivo');
    }
    if (valor > this.valorAcumulado) {
      throw new Error('Valor acumulado insuficiente para realizar o saque');
    }
    
    this.valorAcumulado -= valor;
    
    // Se estava concluída e agora não está mais
    if (this.concluida && this.valorAcumulado < this.valorObjetivo) {
      this.concluida = false;
    }
  }

  /**
   * Verifica se a meta foi concluída e atualiza o status
   */
  verificarConclusao(): void {
    if (this.valorAcumulado >= this.valorObjetivo) {
      this.concluida = true;
    }
  }

  /**
   * Verifica se a meta está atrasada
   * @returns true se a data limite passou e a meta não foi concluída
   */
  estaAtrasada(): boolean {
    return new Date() > this.dataLimite && !this.concluida;
  }

  /**
   * Calcula quantos dias restam para a meta
   * @returns Número de dias restantes (negativo se atrasada)
   */
  diasRestantes(): number {
    const hoje = new Date();
    const diferenca = this.dataLimite.getTime() - hoje.getTime();
    return Math.ceil(diferenca / (1000 * 3600 * 24));
  }

  /**
   * Calcula quanto ainda falta para atingir a meta
   * @returns Valor restante para atingir o objetivo
   */
  valorRestante(): number {
    return Math.max(0, this.valorObjetivo - this.valorAcumulado);
  }

  /**
   * Valida se o nome da meta é válido
   * @param nome - Nome a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarNome(nome: string): boolean {
    return nome.trim().length >= 2 && nome.trim().length <= 100;
  }

  /**
   * Valida se o valor objetivo é válido
   * @param valor - Valor a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarValorObjetivo(valor: number): boolean {
    return valor > 0 && valor <= 9999999.99;
  }

  /**
   * Formata valores monetários para exibição
   * @param valor - Valor a ser formatado
   * @returns Valor formatado em reais
   */
  static formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Retorna a cor do progresso baseada no percentual
   * @returns Classe CSS para a cor
   */
  obterCorProgresso(): string {
    const progresso = this.calcularProgresso();
    if (progresso >= 100) return 'bg-green-500';
    if (progresso >= 75) return 'bg-blue-500';
    if (progresso >= 50) return 'bg-yellow-500';
    if (progresso >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  }
}