// Minimal FormData mock
export class FormData {
  constructor() {
    this.entries = [];
  }

  append(key, value) {
    this.entries.push([key, value]);
  }

  getParts() {
    return this.entries.map(([name, value]) => {
      const headers = { 'content-disposition': `form-data; name="${name}"` };
  
      if (typeof value === 'object') {
        if (typeof value.name === 'string') {
          headers['content-disposition'] += '; filename="' + value.name + '"';
        }
        if (typeof value.type === 'string') {
          headers['content-type'] = value.type;
        }
        return { ...value, headers, fieldName: name };
      }
      return { string: String(value), headers, fieldName: name };
    });
  }
}