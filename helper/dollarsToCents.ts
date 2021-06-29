export default (amount) => {
  return parseInt((parseFloat(amount || 0) * 100).toFixed(0), 10)
}
