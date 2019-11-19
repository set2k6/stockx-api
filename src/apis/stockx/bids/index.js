import moment from 'moment';

import Base from '../../base';
import { randomInclusive, errors } from '../../../utils';

export default class Bids extends Base {
  // TODO!
  async list(options = {}) {}

  async update(bid = {}, options = {}) {
    const { amount } = options;
    const { bearer, currency, headers, jar, proxy, request } = this.context;
    const expiresAt = moment().add(30, 'days').utc().format();

    try {
      let { chainId, skuUuid } = bid;
      if (!amount || !skuUuid || !chainId) {
        const error = new Error('Invalid amount product id, and/or ask id!');
        error.status = 404;
        throw error;
      }

      if (!bearer) {
        const error = new Error('Please login first!');
        error.status = 401;
        throw error;
      }

      const res = await request('https://stockx.com/api/portfolio?a=bid', {
        headers: {
          ...headers,
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        jar,
        json: {
          PortfolioItem: {
            localAmount: amount,
            skuUuid,
            localCurrency: currency,
            expiresAt,
            chainId,
          },
        },
        method: 'POST',
        proxy,
        resolveWithFullResponse: true,
        simple: false,
      });

      const { statusCode, body } = res;
      if (!statusCode || (statusCode && statusCode !== 200)) {
        const err = new Error('Invalid status code!');
        err.status = statusCode || 404;
        throw err;
      }

      ({ PortfolioItem: { chainId, skuUuid }} = body);
      return { chainId, skuUuid };
    } catch (error) {
      return errors(error, 'update bid');
    }
  }

  async place(product, options = {}) {
    const { amount, size } = options;
    const { bearer, currency, headers, request } = this.context;
    const expiresAt = moment().add(30, 'days').utc().format();

    try {
      if (!amount || !size || !product) {
        const error = new Error('Invalid product, amount, and/or size!');
        error.status = 404;
        throw error;
      }

      if (!bearer) {
        const error = new Error('Please login first!');
        error.status = 401;
        throw error;
      }

      const desiredSize = /random/i.test(size) ? randomInclusive(product.variants) : product.variants.find(v => v.size === size);

      if (!desiredSize || (desiredSize && !desiredSize.uuid)) {
        const error = new Error('Size not found!');
        error.status = 404;
        throw error;
      }

      const { uuid } = desiredSize;

      const res = await request('https://stockx.com/api/portfolio?a=bid', {
        headers: {
          ...headers,
          authorization: `Bearer ${bearer}`,
          'content-type': 'application/json',
        },
        json: {
          PortfolioItem: {
            localAmount: amount,
            skuUuid: uuid,
            localCurrency: currency,
            expiresAt,
          },
        },
        method: 'POST',
      });

      const { statusCode, body } = res;
      if (!statusCode || (statusCode && statusCode !== 200)) {
        const err = new Error('Invalid response code!');
        err.status = statusCode || 404;
        throw err;
      }

      const { PortfolioItem: { chainId, skuUuid } } = body;
      return { chainId, skuUuid };
    } catch (error) {
      return errors(error, 'place bid');
    }
  }

  // TODO!
  async remove(options = {}) {}
}
