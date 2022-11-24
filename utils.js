function replacer(key, value) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  }

  return value;
}

function reviver(key, value) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }

  return value;
}

// Probably use uuid here instead of this work around
const uuid = () => (new Date()).getTime().toString(36)

module.exports = {
  replacer,
  reviver,
  uuid,
}
