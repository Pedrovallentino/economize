/**
 * Classe de domínio para representar uma Carteira
 * Contém a lógica de negócio relacionada às carteiras
 */
export class Carteira {
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
   * Atualiza o saldo da carteira
   * @param novoSaldo - O novo saldo a ser definido
   * @throws Error se o saldo for negativo
   */
  atualizarSaldo(novoSaldo: number): void {
    if (novoSaldo < 0) {
      throw new Error('O saldo não pode ser negativo');
    }
    this.saldo = novoSaldo;
  }

  /**
   * Adiciona valor ao saldo da carteira
   * @param valor - Valor a ser adicionado
   * @throws Error se o valor for negativo ou zero
   */
  depositar(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor do depósito deve ser positivo');
    }
    this.saldo += valor;
  }

  /**
   * Remove valor do saldo da carteira
   * @param valor - Valor a ser removido
   * @throws Error se o valor for maior que o saldo ou negativo
   */
  sacar(valor: number): void {
    if (valor <= 0) {
      throw new Error('O valor do saque deve ser positivo');
    }
    if (valor > this.saldo) {
      throw new Error('Saldo insuficiente para realizar o saque');
    }
    this.saldo -= valor;
  }

  /**
   * Valida se o nome da carteira é válido
   * @param nome - Nome a ser validado
   * @returns true se válido, false caso contrário
   */
  static validarNome(nome: string): boolean {
    return nome.trim().length >= 2 && nome.trim().length <= 50;
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
}