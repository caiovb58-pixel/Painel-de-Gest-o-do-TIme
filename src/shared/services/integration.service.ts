import { MatchResult } from '../../types';

export interface WebhookResponse {
  success: boolean;
  status: number;
  message: string;
}

export const IntegrationService = {
  /**
   * Helper to resolve the correct webhook URL, prioritizing runtime config over env vars
   */
  getWebhookUrl(customUrl?: string): string {
    if (customUrl && customUrl.trim()) {
      return customUrl.trim();
    }
    // Try to resolve from possible environment variables
    const envUrl = (import.meta as any).env?.VITE_WEBHOOK_URL || (globalThis as any).process?.env?.REACT_APP_WEBHOOK_URL;
    return envUrl || '';
  },

  /**
   * Dispatches the matches consolidated payload as an async POST request
   */
  async sendMatches(leader: string, matches: MatchResult[], customUrl?: string): Promise<WebhookResponse> {
    const url = this.getWebhookUrl(customUrl);
    if (!url) {
      console.warn('[IntegrationService] No Webhook URL configured.');
      return { success: false, status: 0, message: 'Webhook URL não configurado.' };
    }

    try {
      const payload = {
        event: 'matches_consolidated',
        timestamp: new Date().toISOString(),
        leader,
        matches: matches.map(m => ({
          sdrId: m.sdrId,
          sdrName: m.sdrName,
          assessorId: m.assessorId,
          assessorName: m.assessorName,
          startDate: m.startDate,
          endDate: m.endDate,
          isExclusive: m.isExclusive || false
        }))
      };

      console.log('[IntegrationService] Sending matches consolidated payload:', payload);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          status: response.status,
          message: 'Distribuição consolidada enviada com sucesso!'
        };
      } else {
        return {
          success: false,
          status: response.status,
          message: `Erro no servidor: HTTP ${response.status}`
        };
      }
    } catch (error: any) {
      console.error('[IntegrationService] Error sending matches payload:', error);
      return {
        success: false,
        status: error.name === 'AbortError' ? 408 : 500,
        message: error.message || 'Erro de conexão/rede.'
      };
    }
  },

  /**
   * Dispatches the A.C.E.P.T.O. audit completed payload
   */
  async sendAudit(sdrName: string, leader: string, score: Record<string, number>, notes: string, customUrl?: string): Promise<WebhookResponse> {
    const url = this.getWebhookUrl(customUrl);
    if (!url) {
      return { success: false, status: 0, message: 'Webhook URL não configurado.' };
    }

    try {
      const payload = {
        event: 'audit_completed',
        sdr: sdrName,
        leader,
        score,
        notes,
        timestamp: new Date().toISOString()
      };

      console.log('[IntegrationService] Sending A.C.E.P.T.O. audit payload:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, status: response.status, message: 'Auditoria de cold call enviada com sucesso!' };
      } else {
        return { success: false, status: response.status, message: `Erro no servidor: HTTP ${response.status}` };
      }
    } catch (error: any) {
      console.error('[IntegrationService] Error sending audit payload:', error);
      return {
        success: false,
        status: error.name === 'AbortError' ? 408 : 500,
        message: error.message || 'Erro de conexão/rede.'
      };
    }
  },

  /**
   * Dispatches 1:1 logging completed payload
   */
  async sendOneOnOne(sdrName: string, leader: string, actionPlan: string, notes: string, nextFollowUp: string, status: string, customUrl?: string): Promise<WebhookResponse> {
    const url = this.getWebhookUrl(customUrl);
    if (!url) {
      return { success: false, status: 0, message: 'Webhook URL não configurado.' };
    }

    try {
      const payload = {
        event: 'one_on_one_saved',
        sdr: sdrName,
        leader,
        actionPlan,
        notes,
        nextFollowUp,
        status,
        timestamp: new Date().toISOString()
      };

      console.log('[IntegrationService] Sending 1:1 meeting payload:', payload);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, status: response.status, message: 'Registro de 1:1 enviado com sucesso!' };
      } else {
        return { success: false, status: response.status, message: `Erro no servidor: HTTP ${response.status}` };
      }
    } catch (error: any) {
      console.error('[IntegrationService] Error sending 1:1 payload:', error);
      return {
        success: false,
        status: error.name === 'AbortError' ? 408 : 500,
        message: error.message || 'Erro de conexão/rede.'
      };
    }
  }
};
