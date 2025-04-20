import { MESSAGE_TYPES } from '../scripts/helpers/constants';
import { sendMessage } from '../scripts/helpers/message';
import { formatTransaction } from '../utils/transactions';
import { mydev } from '../scripts/api';

export const getTransactionsKey = (
  pageIndex,
  previousPageData,
  walletAddress
) => {
  if (previousPageData && !previousPageData.length) return null;
  return [pageIndex + 1, walletAddress, `/api/v1/address/${walletAddress}/txs`];
};

/*export const getTransactions = ([pageIndex, walletAddress]) =>
  new Promise((resolve, reject) => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_TRANSACTIONS,
        data: {
          address: walletAddress,
          page: pageIndex,
        },
      },
      ({ transactions }) => {
        if (transactions) {
          const formattedTransactions = [];
          transactions.forEach((transaction) => {
            formattedTransactions.push(
              formatTransaction({ transaction, walletAddress })
            );
          });

          resolve(formattedTransactions);
        } else {
          reject(new Error('Failed to get recent transactions'));
        }
      }
    );
  });*/

  export const getTransactions = async ([pageIndex, walletAddress]) => {
    return new Promise(async (resolve, reject) => {
      //console.log(`Fetching transactions for ${walletAddress} - Page: ${pageIndex}`);
  
      sendMessage(
        {
          message: MESSAGE_TYPES.GET_TRANSACTIONS,
          data: {
            address: walletAddress,
            page: pageIndex,
          },
        },
        async (response) => {
          //console.log('Raw Response from MESSAGE_TYPES.GET_TRANSACTIONS:', response);
  
          if (!response || !Array.isArray(response.transactions)) {
            console.error('Error: No valid transactions received', response);
            return reject(new Error('Failed to get recent transactions'));
          }
  
          try {
            // Extract correct transaction ID before fetching details
            const transactionIds = response.transactions.map(tx => tx.txid || tx.id || tx);
  
            const fullTransactions = await Promise.all(
              transactionIds.map(txId => fetchTransactionDetails(txId))
            );
  
            //console.log('Fetched Full Transactions:', fullTransactions);
  
            const formattedTransactions = fullTransactions.map(transaction =>
              formatTransaction({ transaction, walletAddress })
            );

            //console.log(formattedTransactions, 'formatted')
  
            resolve(formattedTransactions);
          } catch (error) {
            console.error('Error fetching transaction details:', error);
            reject(error);
          }
        }
      );
    });
  };
  
  // Function to fetch full transaction details using API
  const fetchTransactionDetails = async (txId) => {
    try {
      if (typeof txId !== 'string') {
        //console.error('Invalid txId format:', txId);
        throw new Error(`Expected a string but received: ${typeof txId}`);
      }
  
      //console.log(`Fetching details for transaction: ${txId}`);
      const response = await mydev.get(`/api/v1/tx/${txId}`);
  
      if (!response || !response.data) {
        throw new Error(`Invalid response for transaction ${txId}`);
      }
  
      return response.data; // Return full transaction details
    } catch (error) {
      console.error(`Error fetching transaction ${txId}:`, error);
      throw error;
    }
  };
