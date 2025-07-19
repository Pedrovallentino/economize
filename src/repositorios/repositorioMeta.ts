import { supabase } from '@/integrations/supabase/client';
import { MetaFinanceira } from '@/dominio/MetaFinanceira';

/**
 * Interface para dados de criação de meta financeira
 */
export interface DadosCriacaoMeta {
  nome: string;
  valorObjetivo: number;
  dataLimite: Date;
  valorAcumulado?: number;
  descricao?: string;
}

/**
 * Interface para dados de atualização de meta financeira
 */
export interface DadosAtualizacaoMeta {
  nome?: string;
  valorObjetivo?: number;
  valorAcumulado?: number;
  dataLimite?: Date;
  concluida?: boolean;
  descricao?: string;
}

/**
 * Repositório para operações com metas financeiras no banco de dados
 */
export class RepositorioMeta {
  /**
   * Cria uma nova meta financeira
   * @param dados - Dados da meta a ser criada
   * @returns Promise com a meta criada
   * @throws Error se houver falha na criação
   */
  async criar(dados: DadosCriacaoMeta): Promise<MetaFinanceira> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .insert([
        {
          usuario_id: user.user.id,
          nome: dados.nome,
          valor_objetivo: dados.valorObjetivo,
          valor_acumulado: dados.valorAcumulado || 0,
          data_limite: dados.dataLimite.toISOString().split('T')[0],
          descricao: dados.descricao
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar meta: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Lista todas as metas do usuário
   * @returns Promise com array de metas
   */
  async listarTodas(): Promise<MetaFinanceira[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('usuario_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar metas: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Lista metas em andamento (não concluídas)
   * @returns Promise com array de metas em andamento
   */
  async listarEmAndamento(): Promise<MetaFinanceira[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('usuario_id', user.user.id)
      .eq('concluida', false)
      .order('data_limite', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar metas em andamento: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Lista metas concluídas
   * @returns Promise com array de metas concluídas
   */
  async listarConcluidas(): Promise<MetaFinanceira[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('usuario_id', user.user.id)
      .eq('concluida', true)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao listar metas concluídas: ${error.message}`);
    }

    return data?.map(this.mapearParaDominio) || [];
  }

  /**
   * Busca uma meta por ID
   * @param id - ID da meta
   * @returns Promise com a meta encontrada ou null
   */
  async buscarPorId(id: string): Promise<MetaFinanceira | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .select('*')
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar meta: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Atualiza uma meta
   * @param id - ID da meta
   * @param dados - Dados a serem atualizados
   * @returns Promise com a meta atualizada
   * @throws Error se a meta não for encontrada ou houver falha na atualização
   */
  async atualizar(id: string, dados: DadosAtualizacaoMeta): Promise<MetaFinanceira> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const dadosAtualizacao: any = { ...dados };
    
    if (dados.dataLimite) {
      dadosAtualizacao.data_limite = dados.dataLimite.toISOString().split('T')[0];
      delete dadosAtualizacao.dataLimite;
    }

    if (dados.valorObjetivo !== undefined) {
      dadosAtualizacao.valor_objetivo = dados.valorObjetivo;
      delete dadosAtualizacao.valorObjetivo;
    }

    if (dados.valorAcumulado !== undefined) {
      dadosAtualizacao.valor_acumulado = dados.valorAcumulado;
      delete dadosAtualizacao.valorAcumulado;
    }

    const { data, error } = await supabase
      .from('metas_financeiras')
      .update(dadosAtualizacao)
      .eq('id', id)
      .eq('usuario_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar meta: ${error.message}`);
    }

    return this.mapearParaDominio(data);
  }

  /**
   * Exclui uma meta
   * @param id - ID da meta
   * @returns Promise<void>
   * @throws Error se houver falha na exclusão
   */
  async excluir(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('metas_financeiras')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.user.id);

    if (error) {
      throw new Error(`Erro ao excluir meta: ${error.message}`);
    }
  }

  /**
   * Deposita valor em uma meta
   * @param id - ID da meta
   * @param valor - Valor a ser depositado
   * @returns Promise com a meta atualizada
   */
  async depositar(id: string, valor: number): Promise<MetaFinanceira> {
    const meta = await this.buscarPorId(id);
    if (!meta) {
      throw new Error('Meta não encontrada');
    }

    const novoValorAcumulado = meta.valorAcumulado + valor;
    const concluida = novoValorAcumulado >= meta.valorObjetivo;

    return this.atualizar(id, {
      valorAcumulado: novoValorAcumulado,
      concluida
    });
  }

  /**
   * Saca valor de uma meta
   * @param id - ID da meta
   * @param valor - Valor a ser sacado
   * @returns Promise com a meta atualizada
   */
  async sacar(id: string, valor: number): Promise<MetaFinanceira> {
    const meta = await this.buscarPorId(id);
    if (!meta) {
      throw new Error('Meta não encontrada');
    }

    if (valor > meta.valorAcumulado) {
      throw new Error('Valor acumulado insuficiente para realizar o saque');
    }

    const novoValorAcumulado = meta.valorAcumulado - valor;
    const concluida = novoValorAcumulado >= meta.valorObjetivo;

    return this.atualizar(id, {
      valorAcumulado: novoValorAcumulado,
      concluida
    });
  }

  /**
   * Mapeia dados do banco para objeto de domínio
   * @param data - Dados do banco
   * @returns Instância da classe MetaFinanceira
   */
  private mapearParaDominio(data: any): MetaFinanceira {
    return new MetaFinanceira(
      data.id,
      data.nome,
      parseFloat(data.valor_objetivo),
      parseFloat(data.valor_acumulado),
      new Date(data.data_limite),
      data.usuario_id,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.concluida,
      data.descricao
    );
  }
}