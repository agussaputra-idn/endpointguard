export class SessionManager {
  constructor(baseUrl, dispatcher = null) {
    this.baseUrl = baseUrl;
    this.dispatcher = dispatcher;
    this.personas = new Map();
  }

  registerPersona(persona) {
    this.personas.set(persona.role, persona);
  }

  getPersona(role) {
    const persona = this.personas.get(role);
    if (!persona) {
      throw new Error(`Persona ${role} not registered`);
    }
    return persona;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async request(role, options) {
    const persona = this.getPersona(role);
    const { method = 'GET', path, body } = options;

    const headers = {
      'Content-Type': 'application/json',
      ...persona.headers,
    };

    if (persona.token) {
      headers['Authorization'] = `Bearer ${persona.token}`;
    }

    if (this.dispatcher) {
      const response = this.dispatcher(method, path, headers, body);
      return {
        status: response.status,
        headers: response.headers || {},
        data: response.data,
      };
    }

    const url = `${this.baseUrl}${path}`;
    const fetchOptions = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);
    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      data,
    };
  }
}
