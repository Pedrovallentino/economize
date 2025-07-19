import { supabase } from '@/integrations/supabase/client';
import { Movimentacao, TipoMovimentacao, FrequenciaMovimentacao } from '@/dominio/Movimentacao';

/**
 * Interface para dados de criação de movimentação
 */
export interface DadosCriacaoMovimentacao {
  nome: string;
  valor?: number;
  tipo: TipoMovimentacao;
  frequencia: FrequenciaMovimentacao;
  dataVencimento?: Date;
  carteiraId: string;
  descricao?: string;
}

/**
 * Interface para dados de atualização de movimentação
 */
export interface DadosAtualizacaoMovimentacao {
  nome?: string;
  valor?: number;
  tipo?: TipoMovimentacao;
  frequencia?: FrequenciaMovimentacao;
  dataVencimento?: Date;
  descricao?: string;
  ativa?: boolean;
}

/**
 * Repositório para operações com movimentações no banco de dados
 */
export class RepositorioMovimentacao {
  /**
   * Cria uma nova movimentação
   * @param dados - Dados da movimentação a ser criada
   * @returns Promise com a movimentação criada
   * @throws Error se houver falha na criação
   */
  async criar(dados: DadosCriacaoMovimentacao): Promise<Movimentacao> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar carteira atual para atualizar saldo
    const { data: carteiraAtual, error: carteiraError } = await supabase
      .from('carteiras')
      .select('saldo')
      .eq('id', dados.carteiraId)
      .eq('usuario_id', user.user.id)
      .single();

    if (carteiraError) {
      throw new Error(`Erro ao buscar carteira: ${carteiraError.message}`);
    }

    // Calcular novo saldo baseado no tipo de movimentação (apenas se valor for fornecido)
    let novoSaldo = parseFloat(carteiraAtual.saldo.toString());
    if (dados.valor) {
      novoSaldo = dados.tipo === TipoMovimentacao.RECEITA 
        ? novoSaldo + dados.valor 
        : novoSaldo - dados.valor;
    }

    // Definir data padrão para movimentações avulsas sem data
    const dataVencimento = dados.dataVencimento || new Date();
    
    // Inserir movimentação e atualizar saldo da carteira em uma transação
    const { data, error } = await supabase
      .from('movimentacoes')
      .insert([
        {
          usuario_id: user.user.id,
          carteira_id: dados.carteiraId,
          nome: dados.nome,
          valor: dados.valor || 0,
          tipo: dados.tipo,
          frequencia: dados.frequencia,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          descricao: dados.descricao
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar movimentação: ${error.message}`);
    }

    // Atualizar saldo da carteira apenas se valor foi fornecido
    if (dados.valor) {
      const { error: saldoError } = await supabase
        .from('carteiras')
        .update({ saldo: novoSaldo })
        .eq('id', dados.carteiraId)
        .eq('usuario_id', user.user.id);

      if (saldoError) {
        // Se falhar ao atualizar saldo, tentar desfazer a movimentação criada
        await supabase
          .from('movimentacoes')
          .delete()
          .eq('id', data.id);
        
        throw new Error(`Erro ao atualizar saldo da carteira: ${saldoError.message}`);
      }
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Lista todas as movimentações do usuário
   * @param carteiraId - ID da carteira (opcional)
   * @returns Promise com array de movimentações
   */
  async listarTodas(carteiraId?: string): Promise<Movimentacao[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    let query = supabase
      .from('movimentacoes')
      .select('*')
      .eq('usuario_id', user.user.id);

    if (carteiraId) {
      query = query.eq('carteira_id', carteiraId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar movimentações: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Lista movimentações ativas do usuário
   * @param carteiraId - ID da carteira (opcional)
   * @returns Promise com array de movimentações ativas
   */
  async listarAtivas(carteiraId?: string): Promise<Movimentacao[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    let query = supabase
      .from('movimentacoes')
      .select('*')
      .eq('usuario_id', user.user.id)
      .eq('ativa', true);

    if (carteiraId) {
      query = query.eq('carteira_id', carteiraId);
    }

    const { data, error } = await query.order('data_vencimento', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar movimentações ativas: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Busca uma movimentação por ID
   * @param id - ID da movimentação
   * @returns Promise com a movimentação encontrada ou null
   */
  async buscarPorId(id: string): Promise<Movimentacao | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar movimentação: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Atualiza uma movimentação
   * @param id - ID da movimentação
   * @param dados - Dados a serem atualizados
   * @returns Promise com a movimentação atualizada
   * @throws Error se a movimentação não for encontrada ou houver falha na atualização
   */
  async atualizar(id: string, dados: DadosAtualizacaoMovimentacao): Promise<Movimentacao> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const dadosAtualizacao: any = { ...dados };
    
    if (dados.dataVencimento) {
      dadosAtualizacao.data_vencimento = dados.dataVencimento.toISOString().split('T')[0];
      delete dadosAtualizacao.dataVencimento;
    }

    const { data, error } = await supabase
      .from('movimentacoes')
      .update(dadosAtualizacao)
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar movimentação: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Exclui uma movimentação
   * @param id - ID da movimentação
   * @returns Promise<void>
   * @throws Error se houver falha na exclusão
   */
  async excluir(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar dados da movimentação antes de excluir para reverter o saldo
    const { data: movimentacao, error: movError } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (movError) {
      throw new Error(`Erro ao buscar movimentação: ${movError.message}`);
    }

    // Buscar carteira atual
    const { data: carteiraAtual, error: carteiraError } = await supabase
      .from('carteiras')
      .select('saldo')
      .eq('id', movimentacao.carteira_id)
      .eq('usuario_id', user.user.id)
      .single();

    if (carteiraError) {
      throw new Error(`Erro ao buscar carteira: ${carteiraError.message}`);
    }

    // Calcular novo saldo revertendo a movimentação
    const saldoAtual = parseFloat(carteiraAtual.saldo.toString());
    const novoSaldo = movimentacao.tipo === TipoMovimentacao.RECEITA 
      ? saldoAtual - parseFloat(movimentacao.valor.toString())
      : saldoAtual + parseFloat(movimentacao.valor.toString());

    // Excluir movimentação
    const { error } = await supabase
      .from('movimentacoes')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.user.id);

    if (error) {
      throw new Error(`Erro ao excluir movimentação: ${error.message}`);
    }

    // Atualizar saldo da carteira
    const { error: saldoError } = await supabase
      .from('carteiras')
      .update({ saldo: novoSaldo })
      .eq('id', movimentacao.carteira_id)
      .eq('usuario_id', user.user.id);

    if (saldoError) {
      throw new Error(`Erro ao atualizar saldo da carteira: ${saldoError.message}`);
    }
  }

  /**
   * Lista movimentações vencidas
   * @returns Promise com array de movimentações vencidas
   */
  async listarVencidas(): Promise<Movimentacao[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const hoje = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('movimentacoes')
      .select('*')
      .eq('usuario_id', user.user.id)
      .eq('ativa', true)
      .lt('data_vencimento', hoje)
      .order('data_vencimento', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar movimentações vencidas: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Mapeia dados do banco para objeto de domínio
   * @param data - Dados do banco
   * @returns Instância da classe Movimentacao
   */
  private mapearParaDominio(data: any): Movimentacao {
    return new Movimentacao(
      data.id,
      data.nome,
      parseFloat(data.valor),
      data.tipo as TipoMovimentacao,
      data.frequencia as FrequenciaMovimentacao,
      new Date(data.data_vencimento),
      data.carteira_id,
      data.usuario_id,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.ativa,
      data.descricao
    );
  }
}