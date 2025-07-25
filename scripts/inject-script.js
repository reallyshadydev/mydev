import { MESSAGE_TYPES } from './helpers/constants';

const createResponseHandler =
  () =>
  ({ resolve, reject, onSuccess, onError, messageType }) => {
    function listener({ data: { type, data, error }, origin }) {
      // only accept messages from the same origin and message type of this context
      if (origin !== window.location.origin || type !== messageType) return;

      if (error) {
        onError?.(new Error(error));
        reject(new Error(error));
      } else if (data) {
        onSuccess?.(data);
        resolve(data);
      }

      window.removeEventListener('message', listener);
    }
    window.addEventListener('message', listener);
  };

/**
 * Class representing the MyDev API to interact with the Dogecoinev wallet.
 */
class MyDevWallet {
  #requestQueue = [];

  #isRequestPending = false;

  constructor() {
    this.isMyDev = true;
    console.info('MyDev API initialized');
  }

  #createPopupRequestHandler({ requestType, responseType, isDataValid }) {
    return ({ data, onSuccess, onError }) => {
      return new Promise((resolve, reject) => {
        if (data && !isDataValid) {
          onError?.(new Error('Invalid data'));
          reject(new Error('Invalid data'));
          return;
        }
        this.#requestQueue.push({
          onSuccess,
          onError,
          requestType,
          responseType,
          resolve,
          reject,
          data,
        });
        if (!this.#isRequestPending) {
          this.#processNextRequest();
        }
      });
    };
  }

  #createPopupResponseHandler() {
    return ({ resolve, reject, onSuccess, onError, responseType }) => {
      const listener = ({ data: { type, data, error }, origin }) => {
        // only accept messages from the same origin and message type of this context
        if (origin !== window.location.origin || type !== responseType) return;

        if (error) {
          onError?.(new Error(error));
          reject(new Error(error));
        } else if (data) {
          onSuccess?.(data);
          resolve(data);
        }
        // process next request after popup has closed
        setTimeout(() => {
          this.#requestQueue.shift();
          this.#processNextRequest();
          window.removeEventListener('message', listener);
        }, 500);
      };
      window.addEventListener('message', listener);
    };
  }

  #handleRequest({ requestType, data }) {
    window.postMessage({ type: requestType, data }, window.location.origin);
  }

  #handlePopupResponse({ resolve, reject, onSuccess, onError, responseType }) {
    const popupResponseHandler = this.#createPopupResponseHandler();
    popupResponseHandler({ resolve, reject, onSuccess, onError, responseType });
  }

  #processNextRequest() {
    if (this.#requestQueue.length === 0) {
      this.#isRequestPending = false;
      return;
    }
    this.#isRequestPending = true;

    const {
      data,
      resolve,
      reject,
      onSuccess,
      onError,
      requestType,
      responseType,
    } = this.#requestQueue[0];

    this.#handleRequest({ requestType, data });

    this.#handlePopupResponse({
      resolve,
      reject,
      onSuccess,
      onError,
      responseType,
    });
  }

  /**
   * Initiates a connection request with the wallet.
   * @function
   * @async
   * @param {function({ approved: boolean, address: string, balance: number }): void} [onSuccess] - Optional callback function to execute upon successful connection.
   *                                                           Receives an object containing the wallet address and balance.
   * @param {function(string): void} [onError] - Optional callback function to execute upon connection error.
   * @returns {Promise<{ approved: boolean, address: string, publicKey: string, balance: number }>} Promise object representing the outcome of the connection attempt, resolving to an object with the connected address information.
   * @method
   * @example
   * connect(
   *   (result) => console.log(`Connected to wallet: ${result.address}`),
   *   (error) => console.error(`Connection failed: ${error}`)
   * ).then(result => console.log(result.address))
   *   .catch(error => console.error(error));
   */
  connect(onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
    })({ onSuccess, onError });
  }

  /**
   * Retrieves the balance from the connected wallet.
   * @function
   * @async
   * @param {function({ address: string, balance: number }): void} [onSuccess] - Optional callback function to execute upon successful retrieval of balance.
   *                                                           Receives an object containing the wallet address and balance.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in retrieving balance.
   * @returns {Promise<{ address: string, balance: number }>} Promise object representing the outcome of the balance retrieval, resolving to an object with the wallet address and balance.
   * @method
   * @example
   * getBalance(
   *   (result) => console.log(`Connected to wallet: ${result.balance}`),
   *   (error) => console.error(`Connection failed: ${error}`)
   * ).then(result => console.log(result.balance))
   *   .catch(error => console.error(error));
   */
  getBalance(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_BALANCE },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_BALANCE_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the DEV20 token balance based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required to fetch the DEV20 balance, must contain 'ticker'.
   * @param {string} data.ticker - The ticker symbol for the DEV20 token.
   * @param {function({ availableBalance: number, transferableBalance: number, ticker: string, address: string }): void} [onSuccess] - Optional callback function to execute upon successful retrieval.
   *                                                           Receives an object containing the available balance, transferable balance, ticker symbol, and wallet address.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in retrieving balance.
   * @returns {Promise<{ availableBalance: number, transferableBalance: number, ticker: string, address: string }>} Promise object representing the outcome of the balance retrieval, resolving to an object with the wallet address, available balance, and transferable balance.
   * @method
   * @example
   * getDEV20Balance(
   *   { ticker: 'DEV20' },
   *   (result) => console.log(`Available balance: ${result.availableBalance}, transferable balance: ${result.transferableBalance}`),
   *   (error) => console.error(`Balance retrieval failed: ${error}`)
   * ).then(result => console.log(result.availableBalance))
   *   .catch(error => console.error(error));
   */

  getDEV20Balance(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_DEV20_BALANCE, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_DEV20_BALANCE_RESPONSE,
      });
    });
  }

  /**
   * Retrieves transferable DEV20 inscriptions based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required for the query, must contain 'ticker'.
   * @param {string} data.ticker - The ticker symbol for the DEV20 token.
   * @param {function({ inscriptions: Array<{ txid: string, vout: number, ticker: string, contentType: string, content: string, location: string, amount: number }>, ticker: string, address: string }): void} [onSuccess] - Optional callback function to execute upon successful retrieval.
   *                                                           Receives an object containing the transferable inscriptions, ticker symbol, and wallet address.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in fetching the transferable balance.
   * @returns {Promise<{ inscriptions: Array<{ txid: string, vout: number, ticker: string, contentType: string, content: string, location: string, amount: number }>, ticker: string, address: string }>} Promise object representing the outcome of the balance retrieval, resolving to an object with the wallet address, transferable inscriptions, and ticker symbol.}
   * @method
   * @example
   * getTransferableDEV20(
   *   { ticker: 'DEV20' },*
   *   (result) => console.log(`Transferable inscriptions: ${result.inscriptions}`),
   *   (error) => console.error(`Balance retrieval failed: ${error}`)
   * ).then(result => console.log(result.inscriptions))
   *   .catch(error => console.error(error));
   */
  getTransferableDEV20(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DEV20, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_TRANSFERABLE_DEV20_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the Dunes token balance based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required to fetch the Dunes balance, must contain 'ticker'.
   * @param {string} data.ticker - The ticker symbol for the Dunes token.
   * @param {function({ balance: number, ticker: string, address: string }): void} [onSuccess] - Optional callback function to execute upon successful retrieval.
   *                                                           Receives an object containing the balance, ticker symbol, and wallet address.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in retrieving balance.
   * @returns {Promise<{ balance: number, ticker: string, address: string }>} Promise object representing the outcome of the balance retrieval, resolving to an object with the wallet address, ticker and balance.
   * @method
   * @example
   * getDunesBalance(
   *   { ticker: 'DUNES' },
   *   (result) => console.log(`Balance: ${result.balance}`),
   *   (error) => console.error(`Balance retrieval failed: ${error}`)
   * ).then(result => console.log(result.availableBalance))
   *   .catch(error => console.error(error));
   */

  getDunesBalance(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.ticker) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }

      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_GET_DUNES_BALANCE, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_GET_DUNES_BALANCE_RESPONSE,
      });
    });
  }

  /**
   * Requests a Dogecoinev transaction based on the specified data.
   * @function
   * @async
   * @param {Object} data - Data needed for the transaction, must contain 'recipientAddress' and 'devAmount'.
   * @param {string} data.recipientAddress - The recipient address.
   * @param {number} data.devAmount - The amount of Dogecoinev to send.
   * @param {function({ txId: string }): void} [onSuccess] - Optional callback function to execute upon successful transaction request.
   *                                                           Receives an object containing the transaction ID.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in processing the transaction request.
   * @returns {Promise<{ txId: string }>} Promise object representing the outcome of the transaction request, resolving to an object with the transaction ID.
   * @method
   * @example
   * requestTransaction(
   *   { recipientAddress: 'DAHkCF5LajV6jYyi5o4eMvtpqXRcm9eZYq', devAmount: 100 },
   *   (result) => console.log(`Transaction ID: ${result.txId}`),
   *   (error) => console.error(`Transaction request failed: ${error}`)
   * ).then(result => console.log(result.txId))
   *   .catch(error => console.error(error));
   */
  requestTransaction(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
      isDataValid: data?.recipientAddress && data?.devAmount,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests an inscription transaction for Devinal/PRC-20 based on the specified data.
   * @function
   * @async
   * @param {Object} data - Data required for the transaction, must contain 'recipientAddress' and 'output'.
   * @param {string} data.recipientAddress - The recipient address.
   * @param {string} data.location - The location of the inscription in the format txid:vout:offset.
   * @param {function({ txId: string }): void} [onSuccess] - Optional callback function to execute upon successful transaction request.
   *                                                           Receives an object containing the transaction ID.
   * @param {function(string): void} [onError] - Optional function to execute upon error in processing the transaction request.
   * @returns {Promise<{ txId: string }>} Promise object representing the outcome of the transaction request, resolving to an object with the transaction ID.
   * @method
   * @example
   * requestInscriptionTransaction(
   *   { recipientAddress: 'DAHkCF5LajV6jYyi5o4eMvtpqXRcm9eZYq', location: '18d83f35060323a20e158805805e217b3ab7d849d5a1131f0ed8eba3a31c39a7:0:0' },
   *   (result) => console.log(`Transaction ID: ${result.txId}`),
   *   (error) => console.error(`Transaction request failed: ${error}`)
   * ).then(result => console.log(result.txId))
   *   .catch(error => console.error(error));
   */
  requestInscriptionTransaction(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_DEVINAL_TRANSACTION,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_DEVINAL_TRANSACTION_RESPONSE,
      isDataValid: data?.recipientAddress && data?.location,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests a transaction for available DEV20 tokens based on specified data.
   * @function
   * @async
   * @param {Object} data - Data required for the transaction, must contain 'ticker' and 'amount'.
   * @param {string} data.ticker - The ticker symbol for the DEV20 token.
   * @param {string} data.amount - The amount of DEV20 tokens to make available.
   * @param {function({ txId: string, ticker: string, amount: number }): void} [onSuccess] - Optional callback function to execute upon successful transaction request.
   *
   * Receives an object containing the transaction ID, ticker symbol, and amount.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in processing the transaction request.
   * @returns {Promise<{ txId: string, ticker: string, amount: number }>} Promise object representing the outcome of the transaction request, resolving to an object with the transaction ID, ticker symbol, and amount.
   * @method
   * @example
   * requestInscriptionTransaction(
   *   { ticker: 'DEV20', amount: 100 },
   *   (result) => console.log(`Transaction ID: ${result.txId} `),
   *   (error) => console.error(`Transaction request failed: ${error}`)
   * ).then(result => console.log(result.txId))
   *   .catch(error => console.error(error));
   */
  requestAvailableDEV20Transaction(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DEV20_TRANSACTION,
      responseType:
        MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DEV20_TRANSACTION_RESPONSE,
      isDataValid: data?.ticker && data?.amount,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests a transaction for Dunes tokens based on specified data.
   * @function
   * @async
   * @param {Object} data - Data required for the transaction, must contain 'ticker' and 'amount'.
   * @param {string} data.ticker - The ticker symbol for the Dunes token.
   * @param {string} data.amount - The amount of Dunes tokens to make available.
   * @param {string} data.recipientAddress - The Dogecoinev address of the recipient.
   * @param {function({ txId: string, ticker: string, amount: number }): void} [onSuccess] - Optional callback function to execute upon successful transaction request.
   *
   * Receives an object containing the transaction ID, ticker symbol, and amount.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in processing the transaction request.
   * @returns {Promise<{ txId: string, ticker: string, amount: number }>} Promise object representing the outcome of the transaction request, resolving to an object with the transaction ID, ticker symbol, and amount.
   * @method
   * @example
   * requestDunesTransaction(
   *   { ticker: 'DUNES', amount: 100, recipientAddress: 'DAHkCF5LajV6jYyi5o4eMvtpqXRcm9eZYq' },
   *   (result) => console.log(`Transaction ID: ${result.txId} `),
   *   (error) => console.error(`Transaction request failed: ${error}`)
   * ).then(result => console.log(result.txId))
   *   .catch(error => console.error(error));
   */
  requestDunesTransaction(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_DUNES_TRANSACTION,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_DUNES_TRANSACTION_RESPONSE,
      isDataValid: data?.ticker && data?.amount && data?.recipientAddress,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests the signing of a partially signed Bitcoin transaction (PSBT) based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required for signing the PSBT, must contain 'rawTx' and an array of indexes to sign 'indexes'.
   * @param {string} data.rawTx - The raw transaction to be signed.
   * @param {number[]} data.indexes - The indexes of the inputs to be signed.
   * @param {boolean} data.signOnly - A flag to indicate whether to return the raw tx after signing instead of signing + sending (default: false)
   * @param {boolean} data.partial - A flag to indicate whether to create partial signatures. Only effective when signOnly is true (default: false)
   * @param {number} data.sighashType - The signature hash type to use. Only effective when partial is true. Possible values:
   *                                   - SIGHASH_ALL (0x01): Signs all inputs and outputs (default)
   *                                   - SIGHASH_SINGLE (0x03): Signs all inputs, and the output with the same index
   *                                   - SIGHASH_ANYONECANPAY (0x80): Can be combined with above types using bitwise OR
   *                                   Combinations:
   *                                   - SIGHASH_ALL|SIGHASH_ANYONECANPAY (0x81): Signs one input and all outputs
   *                                   - SIGHASH_SINGLE|SIGHASH_ANYONECANPAY (0x83): Signs one input and one output at same index
   *                                   Note:
   *                                   - SIGHASH_NONE (0x02) is not supported for security reasons - it signs inputs but no outputs, allowing transaction outputs to be modified after signing
   * @param {function({ txId: string }): void} [onSuccess] - Optional callback function to execute upon successful signing.
   *                                                           Receives an object containing the transaction ID.
   * @param {function(string): void} [onError] - Callback function to execute upon error in signing the PSBT.
   * @returns {Promise<{ txId: string, signedRawTx: string }>} Promise object representing the outcome of the transaction request, resolving to an object with the transaction ID or the signed raw transaction if signOnly = true.
   * @method
   * @example
   * requestPsbt(
   *   { rawTx: '02000000000101...', indexes: [0] },
   *   (result) => console.log(`Transaction ID: ${result.txId}`),
   *   (error) => console.error(`Transaction request failed: ${error}`)
   * ).then(result => console.log(result.txId))
   *   .catch(error => console.error(error));
   */
  requestPsbt(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_PSBT,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
      isDataValid: data?.rawTx && data?.indexes?.length,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests the signing of an arbitrary message based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required for the message signing, must contain 'message'.
   * @param {string} data.message - The message to be signed.
   * @param {function({ signedMessage: string }): void} [onSuccess] - Optional callback function to execute upon successful message signing.
   *                                                           Receives an object containing the signed message.
   * @param {function(string): void} [onError] - Callback function to execute upon error in signing the message.
   * @returns {Promise<{ signedMessage: string }>} Promise object representing the outcome of the request, resolving to an object with the base64 signed message.
   * @method
   * @example
   * requestSignedMessage(
   *   { message: 'Hello, World!' },
   *   (result) => console.log(`Signed message: ${result.signedMessage}`),
   *   (error) => console.error(`Message signing failed: ${error}`)
   * ).then(result => console.log(result.signedMessage))
   *   .catch(error => console.error(error));
   */
  requestSignedMessage(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_SIGNED_MESSAGE_RESPONSE,
      isDataValid: !!data?.message,
    })({ data, onSuccess, onError });
  }

  /**
   * Requests the decrypting of an arbitrary message encrypted by the connected address public key.
   * @function
   * @async
   * @param {Object} data - Data required for the decryption, must contain 'message'.
   * @param {string} data.message - The message to be decrypted.
   * @param {function({ decryptedMessage: string }): void} [onSuccess] - Optional callback function to execute upon successful message signing.
   *                                                           Receives an object containing the decrypted message.
   * @param {function(string): void} [onError] - Callback function to execute upon error in decrypting the message.
   * @returns {Promise<{ decryptedMessage: string }>} Promise object representing the outcome of the request, resolving to an object with the decrypted message.
   * @method
   * @example
   * requestDecryptedMessage(
   *   { message: 'STjKie7Bsm9/MtwkCimz2A==' },
   *   (result) => console.log(`Decrypted message: ${result.decryptedMessage}`),
   *   (error) => console.error(`Message decryption failed: ${error}`)
   * ).then(result => console.log(result.decryptedMessage))
   *   .catch(error => console.error(error));
   */
  requestDecryptedMessage(data, onSuccess, onError) {
    return this.#createPopupRequestHandler({
      requestType: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE,
      responseType: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
      isDataValid: !!data?.message,
    })({ data, onSuccess, onError });
  }

  /**
   * Disconnects the current session with the wallet.
   * @function
   * @async
   * @param {function(): void} [onSuccess] - Optional callback function to execute upon successful disconnection.
   *
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in disconnecting.
   * @returns {Promise<void>} Promise object representing the disconnection outcome.
   * @method
   * @example
   * disconnect(
   *   () => console.log(`Disconnected from wallet`),
   *   (error) => console.error(`Disconnection failed: ${error}`)
   * ).then(() => console.log('Disconnected from wallet'))
   *   .catch(error => console.error(error));
   */
  disconnect(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_DISCONNECT },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_DISCONNECT_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the connection status with the wallet.
   * @function
   * @async
   * @param {function({ connected: boolean, address: string, selectedWalletAddress: string }): void} [onSuccess] - Optional callback function to execute upon successfully retrieving the status.
   *                                                           Receives an object containing the wallet address, selected wallet address, and connection status.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in retrieving the connection status.
   * @returns {Promise<{ connected: boolean, address: string, selectedWalletAddress: string }>} Promise object representing the outcome of the connection status retrieval, resolving to an object with the wallet address, selected wallet address, and connection status.
   * @method
   * @example
   * getConnectionStatus(
   *   (result) => console.log(`Connected to wallet: ${result.connected}`),
   *   (error) => console.error(`Connection status retrieval failed: ${error}`)
   * ).then(result => console.log(result.connected))
   *   .catch(error => console.error(error));
   */
  getConnectionStatus(onSuccess, onError) {
    return new Promise((resolve, reject) => {
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_CONNECTION_STATUS_RESPONSE,
      });
    });
  }

  /**
   * Retrieves the status of a specific transaction based on provided data.
   * @function
   * @async
   * @param {Object} data - Data required for the query, must contain 'txId'.
   * @param {string} data.txId - The transaction ID to query.
   * @param {function({ txId: string, confirmations: number, status: string, devAmount: number, blockTime: number, address: string }): void} [onSuccess] - Optional callback function to execute upon successfully retrieving the status.
   *                                                           Receives an object containing the number of txId, confirmations, status, amount, blockTime and address for the given tx.
   * @param {function(string): void} [onError] - Optional callback function to execute upon error in retrieving the tx status.
   * @returns {Promise<{ txId: string, confirmations: number, status: string, devAmount: number, blockTime: number, address: string }>} Promise object representing the outcome of the tx retrieval, resolving to an object with the txId, confirmations, status, amount, blockTime and address for the given tx.
   * @method
   * @example
   * getTransactionStatus(
   *   { txId: '18d83f35060323a20e158805805e217b3ab7d849d5a1131f0ed8eba3a31c39a7' },
   *   (result) => console.log(`Trasaction status: ${result.status}`),
   *   (error) => console.error(`Transaction status retrieval failed: ${error}`)
   * ).then(result => console.log(result.status))
   *   .catch(error => console.error(error));
   */
  getTransactionStatus(data, onSuccess, onError) {
    return new Promise((resolve, reject) => {
      if (!data?.txId) {
        onError?.(new Error('Invalid data'));
        reject(new Error('Invalid data'));
        return;
      }
      window.postMessage(
        { type: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS, data },
        window.location.origin
      );

      createResponseHandler()({
        resolve,
        reject,
        onSuccess,
        onError,
        messageType: MESSAGE_TYPES.CLIENT_TRANSACTION_STATUS_RESPONSE,
      });
    });
  }
}

// API we expose to allow websites to detect & interact with extension
const dev = new MyDevWallet();

window.addEventListener('load', () => {
  window.dev = dev;
  window.dispatchEvent(new Event('dev#initialized'));
  console.info('MyDev API dispatched to window object');
});
