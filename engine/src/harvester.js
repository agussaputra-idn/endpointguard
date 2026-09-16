export class ResourceHarvester {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.matrix = {};
  }

  async harvestForPersona(role, configs) {
    if (!this.matrix[role]) {
      this.matrix[role] = {};
    }

    for (const config of configs) {
      console.log(`[Harvester] Fetching ${config.resourceType} list for persona ${role} from ${config.listEndpoint}...`);
      try {
        const response = await this.sessionManager.request(role, {
          method: 'GET',
          path: config.listEndpoint,
        });

        if (response.status >= 200 && response.status < 300) {
          const data = response.data;
          const items = Array.isArray(data) ? data : (data && (data.items || data.data)) || [];

          const ids = items.map((item) => {
            if (config.idFieldExtractor) {
              return config.idFieldExtractor(item);
            }
            return item.id || item._id || item.uuid || item[`${config.resourceType}Id`];
          }).filter(Boolean);

          this.matrix[role][config.resourceType] = ids;
          console.log(`[Harvester] Discovered ${ids.length} ${config.resourceType}(s) for ${role}: [${ids.join(', ')}]`);
        } else {
          console.warn(`[Harvester] Could not list ${config.resourceType} for ${role}: HTTP ${response.status}`);
          this.matrix[role][config.resourceType] = [];
        }
      } catch (err) {
        console.error(`[Harvester] Error listing ${config.resourceType} for ${role}:`, err.message);
        this.matrix[role][config.resourceType] = [];
      }
    }
  }

  getOwnershipMatrix() {
    return this.matrix;
  }
}
