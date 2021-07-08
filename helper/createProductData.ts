export default (product, opts: Record<string, any> = {}) => {
  return {
    id: product.sku,
    variantIds: [product.sku],
    price: parseInt((parseFloat(product.final_price || 0) * 100).toFixed(0), 10),
    quantity: product.qty || opts.qty,
    discounted: !!opts.coupon_code,
    displayName: product.name
  }
}
