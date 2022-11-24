// Probably use uuid here instead of this work around
const uuid = () => (new Date()).getTime().toString(36)

module.exports = {
  uuid,
}
