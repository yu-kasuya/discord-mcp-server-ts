export class DiscordClient {
  private token: string;
  private baseUrl = 'https://discord.com/api/v10';

  constructor(token: string) {
    this.token = token;
  }

  async get(path: string): Promise<any> {
    return this.request('GET', path);
  }

  async post(path: string, body?: object): Promise<any> {
    return this.request('POST', path, body);
  }

  async put(path: string, body?: object): Promise<any> {
    return this.request('PUT', path, body);
  }

  async patch(path: string, body?: object): Promise<any> {
    return this.request('PATCH', path, body);
  }

  async delete(path: string): Promise<any> {
    return this.request('DELETE', path);
  }

  async postWebhook(webhookId: string, token: string, body: object): Promise<any> {
    return this.request('POST', `/webhooks/${webhookId}/${token}?wait=true`, body, false);
  }

  private async request(method: string, path: string, body?: object, useAuth: boolean = true): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (useAuth) {
      headers.Authorization = `Bot ${this.token}`;
    }

    let response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
    }

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let message = `Discord API Error ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        message += `: ${json.message || errorText}`;
        if (json.code) {
          message += ` (code: ${json.code})`;
          // Add helpful context for common errors
          switch (json.code) {
            case 10003:
              message += " - Channel not found or bot lacks access";
              break;
            case 10008:
              message += " - Message not found";
              break;
            case 50001:
              message += " - Bot lacks permission for this action";
              break;
            case 50013:
              message += " - Bot lacks required permissions";
              break;
            case 50035:
              message += " - Invalid form body (check parameter format)";
              break;
          }
        }
        if (json.errors) message += `\n${JSON.stringify(json.errors, null, 2)}`;
      } catch {
        message += `: ${errorText}`;
      }
      throw new Error(message);
    }

    return response.json();
  }
}