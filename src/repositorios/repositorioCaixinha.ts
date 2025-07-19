import { supabase } from '@/integrations/supabase/client';
import { CaixinhaPoupanca, HistoricoCaixinha, TipoMovimentacaoCaixinha } from '@/dominio/CaixinhaPoupanca';

/**
 * Interface para dados de criação de caixinha
 */
export interface DadosCriacaoCaixinha {
  nome: string;
  saldo?: number;
  descricao?: string;
}

/**
 * Interface para dados de atualização de caixinha
 */
export interface DadosAtualizacaoCaixinha {
  nome?: string;
  saldo?: number;
  descricao?: string;
}

/**
 * Repositório para operações com caixinhas de poupança no banco de dados
 */
export class RepositorioCaixinha {
  /**
   * Cria uma nova caixinha de poupança
   * @param dados - Dados da caixinha a ser criada
   * @returns Promise com a caixinha criada
   * @throws Error se houver falha na criação
   */
  async criar(dados: DadosCriacaoCaixinha): Promise<CaixinhaPoupanca> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('caixinhas_poupanca')
      .insert([
        {
          usuario_id: user.user.id,
          nome: dados.nome,
          saldo: dados.saldo || 0,
          descricao: dados.descricao
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar caixinha: ${error.message}`);
    }

    // Se houver saldo inicial, registrar no histórico
    if (dados.saldo && dados.saldo > 0) {
      await this.registrarHistorico({
        id: '',
        caixinhaId: data.id,
        tipo: TipoMovimentacaoCaixinha.DEPOSITO,
        valor: dados.saldo,
        saldoAnterior: 0,
        saldoNovo: dados.saldo,
        descricao: 'Saldo inicial',
        createdAt: new Date()
      });
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Lista todas as caixinhas do usuário
   * @returns Promise com array de caixinhas
   */
  async listarTodas(): Promise<CaixinhaPoupanca[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('caixinhas_poupanca')
      .select('*')
      .eq('usuario_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar caixinhas: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Busca uma caixinha por ID
   * @param id - ID da caixinha
   * @returns Promise com a caixinha encontrada ou null
   */
  async buscarPorId(id: string): Promise<CaixinhaPoupanca | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('caixinhas_poupanca')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar caixinha: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Atualiza uma caixinha
   * @param id - ID da caixinha
   * @param dados - Dados a serem atualizados
   * @returns Promise com a caixinha atualizada
   * @throws Error se a caixinha não for encontrada ou houver falha na atualização
   */
  async atualizar(id: string, dados: DadosAtualizacaoCaixinha): Promise<CaixinhaPoupanca> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('caixinhas_poupanca')
      .update(dados)
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar caixinha: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Exclui uma caixinha
   * @param id - ID da caixinha
   * @returns Promise<void>
   * @throws Error se houver falha na exclusão
   */
  async excluir(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('caixinhas_poupanca')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.user.id);

    if (error) {
      throw new Error(`Erro ao excluir caixinha: ${error.message}`);
    }
  }

  /**
   * Deposita valor em uma caixinha
   * @param id - ID da caixinha
   * @param valor - Valor a ser depositado
   * @param descricao - Descrição opcional da operação
   * @returns Promise com a caixinha atualizada
   */
  async depositar(id: string, valor: number, descricao?: string): Promise<CaixinhaPoupanca> {
    const caixinha = await this.buscarPorId(id);
    if (!caixinha) {
      throw new Error('Caixinha não encontrada');
    }

    const saldoAnterior = caixinha.saldo;
    const novoSaldo = saldoAnterior + valor;

    // Atualizar saldo da caixinha
    const caixinhaAtualizada = await this.atualizar(id, { saldo: novoSaldo });

    // Registrar no histórico
    await this.registrarHistorico({
      id: '',
      caixinhaId: id,
      tipo: TipoMovimentacaoCaixinha.DEPOSITO,
      valor,
      saldoAnterior,
      saldoNovo: novoSaldo,
      descricao,
      createdAt: new Date()
    });

    return caixinhaAtualizada;
  }

  /**
   * Saca valor de uma caixinha
   * @param id - ID da caixinha
   * @param valor - Valor a ser sacado
   * @param descricao - Descrição opcional da operação
   * @returns Promise com a caixinha atualizada
   */
  async sacar(id: string, valor: number, descricao?: string): Promise<CaixinhaPoupanca> {
    const caixinha = await this.buscarPorId(id);
    if (!caixinha) {
      throw new Error('Caixinha não encontrada');
    }

    if (valor > caixinha.saldo) {
      throw new Error('Saldo insuficiente para realizar o saque');
    }

    const saldoAnterior = caixinha.saldo;
    const novoSaldo = saldoAnterior - valor;

    // Atualizar saldo da caixinha
    const caixinhaAtualizada = await this.atualizar(id, { saldo: novoSaldo });

    // Registrar no histórico
    await this.registrarHistorico({
      id: '',
      caixinhaId: id,
      tipo: TipoMovimentacaoCaixinha.SAQUE,
      valor,
      saldoAnterior,
      saldoNovo: novoSaldo,
      descricao,
      createdAt: new Date()
    });

    return caixinhaAtualizada;
  }

  /**
   * Busca o histórico de uma caixinha
   * @param caixinhaId - ID da caixinha
   * @returns Promise com array do histórico
   */
  async buscarHistorico(caixinhaId: string): Promise<HistoricoCaixinha[]> {
    const { data, error } = await supabase
      .from('historico_caixinhas')
      .select('*')
      .eq('caixinha_id', caixinhaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar histórico: ${error.message}`);
    }

    return data?.map(this.mapearHistoricoParaDominio) || [];
  }

  /**
   * Registra uma entrada no histórico
   * @param entrada - Dados da entrada do histórico
   * @returns Promise<void>
   */
  private async registrarHistorico(entrada: HistoricoCaixinha): Promise<void> {
    const { error } = await supabase
      .from('historico_caixinhas')
      .insert([
        {
          caixinha_id: entrada.caixinhaId,
          tipo: entrada.tipo,
          valor: entrada.valor,
          saldo_anterior: entrada.saldoAnterior,
          saldo_novo: entrada.saldoNovo,
          descricao: entrada.descricao
        }
      ]);

    if (error) {
      throw new Error(`Erro ao registrar histórico: ${error.message}`);
    }
  }

  /**
   * Mapeia dados do banco para objeto de domínio
   * @param data - Dados do banco
   * @returns Instância da classe CaixinhaPoupanca
   */
  private mapearParaDominio(data: any): CaixinhaPoupanca {
    return new CaixinhaPoupanca(
      data.id,
      data.nome,
      parseFloat(data.saldo),
      data.usuario_id,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.descricao
    );
  }

  /**
   * Mapeia dados do histórico do banco para objeto de domínio
   * @param data - Dados do histórico do banco
   * @returns Objeto HistoricoCaixinha
   */
  private mapearHistoricoParaDominio(data: any): HistoricoCaixinha {
    return {
      id: data.id,
      caixinhaId: data.caixinha_id,
      tipo: data.tipo as TipoMovimentacaoCaixinha,
      valor: parseFloat(data.valor),
      saldoAnterior: parseFloat(data.saldo_anterior),
      saldoNovo: parseFloat(data.saldo_novo),
      descricao: data.descricao,
      createdAt: new Date(data.created_at)
    };
  }
}