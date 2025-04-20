import { mydev } from '../scripts/api';

export function getTxSummary(tx, address) {
  // console.log('tx', tx);
  const ret = { type: '', amount: 0, fromAddr: '', toAddr: '' };
  // Assumes one to one sender / receiver per tx, TODO multiple
  tx.inputs.forEach((input) => {
    // console.log('input', input);
    input.addresses.forEach((addr) => {
      if (addr === address) {
        ret.type = 'outgoing';
        ret.fromAddr = address;
      } else if (ret.type === '') {
        ret.type = 'incoming';
        ret.fromAddr = addr;
      }
    });
  });
  ret.amount = 0;
  tx.outputs.forEach((output) => {
    // console.log('output', output);
    output.addresses?.forEach((addr) => {
      if (
        (ret.type === 'incoming' && addr === address) ||
        (ret.type === 'outgoing' && addr !== address)
      ) {
        ret.amount += output.value;
        ret.toAddr = ret.type === 'incoming' ? address : addr;
      }
    });
  });

  return ret;
}

/*export const formatTransaction = ({ transaction: tx, walletAddress }) => {
  let type = 'incoming';
  let amountIn = 0;
  let amountOut = 0;
  let totalIn = 0;
  let totalOut = 0;
  let incomingAddress = '';
  let outgoingAddress = '';
  console.log(tx, 'tx')

  const vinArray = Array.isArray(tx.vin) ? tx.vin : [tx.vin];
  const voutArray = Array.isArray(tx.vout) ? tx.vout : [tx.vout];

  vinArray.forEach((input) => {
    //const [address] = input.addresses;
    const address = input.prevout.scriptpubkey_address;
    const value = Number(input.prevout.value);

    if (!incomingAddress && address !== walletAddress) {
      incomingAddress = address;
    }

    //if (input.addresses.includes(walletAddress)) {
      //amountOut += value;
    //}
    if (input.prevout.scriptpubkey_address === walletAddress) {
      amountOut += input.prevout.value;
    }

    totalIn += value;
  });


  voutArray.forEach((output) => {
    if (output.scriptpubkey_address) {
      const address = output.scriptpubkey_address;
      const value = Number(output.value);
  
      if (!outgoingAddress && outgoingAddress !== walletAddress) {
        outgoingAddress = address;
      }
  
      if (address === walletAddress) {
        amountOut += value;
      }
  
      totalOut += value;
    } else {
      outgoingAddress = tx.vout[2]?.scriptpubkey_address || null;
    }
  });
  

  if (amountOut > amountIn) {
    type = 'outgoing';
  }

  const fee = totalIn - totalOut;
  let amount =
    type === 'incoming' ? amountIn - amountOut : amountOut - amountIn - fee;
  let address = type === 'incoming' ? incomingAddress : outgoingAddress;
  const { txid: id, blockTime, confirmations } = tx;

  if (type === 'outgoing' && amount < 0) {
    address = incomingAddress;
    type = 'incoming';
    amount = -amount;
  }

  console.log(amount, 'amount')
  return { address, amount, type, blockTime, id, confirmations, fee };
};*/

async function getConfirmations(tx) {
  const blockHeight = tx.status?.block_height || null;

  if (!blockHeight) {
    return 0; // Transaction is unconfirmed
  }

  //console.log(blockHeight, 'blockHeight')

  try {
    // Fetch the latest block height from a blockchain API
    //const response = await fetch('https://mempool.space/api/blocks/tip/height');
    const response = await mydev.get(`/api/v1/blocks/tip/height`);
    //console.log(response.data, 'latestblock')
    const latestBlockHeight = Number(response.data);

    return latestBlockHeight - blockHeight + 1;
  } catch (error) {
    console.error('Error fetching latest block height:', error);
    return null; // Handle errors gracefully
  }
}


/*export const formatTransaction = async ({ transaction: tx, walletAddress }) => {
  let type = 'incoming';
  let amountIn = 0;
  let amountOut = 0;
  let totalIn = 0;
  let totalOut = 0;
  let incomingAddress = '';
  let outgoingAddress = '';

  console.log(tx, 'tx');

  const vinArray = Array.isArray(tx.vin) ? tx.vin : [tx.vin];
  const voutArray = Array.isArray(tx.vout) ? tx.vout : [tx.vout];

  // Process transaction inputs
  vinArray.forEach((input) => {
    const address = input.prevout.scriptpubkey_address;
    const value = Number(input.prevout.value);

    if (!incomingAddress && address !== walletAddress) {
      incomingAddress = address;
    }

    if (address === walletAddress) {
      amountOut += value;
    }

    totalIn += value;
  });

  // Process transaction outputs
  voutArray.forEach((output) => {
    if (output.scriptpubkey_address) {
      const address = output.scriptpubkey_address;
      const value = Number(output.value);

      if (!outgoingAddress && address !== walletAddress) {
        outgoingAddress = address;
      }

      if (address === walletAddress) {
        amountIn += value;
      }

      totalOut += value;
    } else {
      outgoingAddress = tx.vout[2]?.scriptpubkey_address || null;
    }
  });

  // Determine transaction type
  if (amountOut > amountIn) {
    type = 'outgoing';
  }

  const fee = totalIn - totalOut;
  let amount = type === 'incoming' ? amountIn : amountOut;
  if (type === 'outgoing') {
    amount += fee; // Ensures the correct total spent amount
  }

  let address = type === 'incoming' ? incomingAddress : outgoingAddress;
  const blockTime = tx.blockTime || tx.time || tx.status?.block_time || null;
  
  let confirmations = 0;
  if (tx.status?.block_height) {
    confirmations = await getConfirmations(tx);
  }

  const { txid: id } = tx;

  if (type === 'outgoing' && amount < 0) {
    address = incomingAddress;
    type = 'incoming';
    amount = -amount;
  }

  console.log(address, amount, type, blockTime, id, confirmations, fee, 'amount');
  return { address, amount, type, blockTime, id, confirmations, fee };
};*/

export const formatTransaction = async ({ transaction: tx, walletAddress }) => {
  let type = "incoming";
  let amountIn = 0;
  let amountOut = 0;
  let totalIn = 0;
  let totalOut = 0;
  let incomingAddress = "";
  let outgoingAddress = "";

  const vinArray = Array.isArray(tx.vin) ? tx.vin : [tx.vin];
  const voutArray = Array.isArray(tx.vout) ? tx.vout : [tx.vout];

  // Process transaction inputs
  vinArray.forEach((input) => {
    if (input.prevout && input.prevout.scriptpubkey_address) {
      const address = input.prevout.scriptpubkey_address;
      const value = Number(input.prevout.value);

      totalIn += value; // Total amount coming into the transaction

      if (address === walletAddress) {
        amountOut += value; // Track the amount sent from the wallet
      } else if (!incomingAddress) {
        incomingAddress = address; // First input address that is not walletAddress
      }
    }
  });

  // Process transaction outputs
  voutArray.forEach((output) => {
    if (output.scriptpubkey_address) {
      const address = output.scriptpubkey_address;
      const value = Number(output.value);

      totalOut += value; // Total amount going out of the transaction

      if (address === walletAddress) {
        amountIn += value; // Track received funds (including change)
      } else if (!outgoingAddress) {
        outgoingAddress = address; // First output address that is not walletAddress
      }
    }
  });

  // Determine transaction type
  if (amountOut > 0) {
    type = "outgoing";
  }

  const fee = totalIn - totalOut; // Fee is the difference between inputs and outputs

  // Calculate the actual amount sent to another address (excluding change)
  const actualAmountOut = totalOut - amountIn;

  let amount = type === "incoming" ? amountIn : actualAmountOut;
  if (type === "outgoing") {
    amount += fee; // Ensures the correct total spent amount
  }

  let address = type === "incoming" ? incomingAddress : outgoingAddress;
  const blockTime = tx.blockTime || tx.time || tx.status?.block_time || null;

  let confirmations = 0;
  if (tx.status?.block_height) {
    confirmations = await getConfirmations(tx);
  }

  const { txid: id } = tx;

  if (type === "outgoing" && amount < 0) {
    address = incomingAddress;
    type = "incoming";
    amount = -amount;
  }

  return { address, amount, type, blockTime, id, confirmations, fee };
};



/*export const formatTransaction = async ({ transaction: tx, walletAddress }) => {
  let type = "incoming";
  let amountIn = 0;
  let amountOut = 0;
  let totalIn = 0;
  let totalOut = 0;
  let incomingAddress = "";
  let outgoingAddress = "";

  //console.log(tx, "tx");

  const vinArray = Array.isArray(tx.vin) ? tx.vin : [tx.vin];
  const voutArray = Array.isArray(tx.vout) ? tx.vout : [tx.vout];

  // Process transaction inputs
  vinArray.forEach((input) => {
    if (input.prevout && input.prevout.scriptpubkey_address) {
      const address = input.prevout.scriptpubkey_address;
      const value = Number(input.prevout.value);

      totalIn += value; // Total amount coming into the transaction

      if (address === walletAddress) {
        amountOut += value; // Track the amount sent from the wallet
      } else if (!incomingAddress) {
        incomingAddress = address; // First input address that is not walletAddress
      }
    }
  });

  // Process transaction outputs
  voutArray.forEach((output) => {
    if (output.scriptpubkey_address) {
      const address = output.scriptpubkey_address;
      const value = Number(output.value);

      totalOut += value; // Total amount going out of the transaction

      if (address === walletAddress) {
        amountIn += value; // Track received funds
      } else if (!outgoingAddress) {
        outgoingAddress = address; // First output address that is not walletAddress
      }
    }
  });

  // Process transaction outputs


  // Determine transaction type
  if (amountOut > amountIn) {
    type = "outgoing";
  }

  const fee = totalIn - totalOut; // Fee is the difference between inputs and outputs

  let amount = type === "incoming" ? amountIn : amountOut;
  if (type === "outgoing") {
    amount += fee; // Ensures the correct total spent amount
  }

  let address = type === "incoming" ? incomingAddress : outgoingAddress;
  const blockTime = tx.blockTime || tx.time || tx.status?.block_time || null;

  let confirmations = 0;
  if (tx.status?.block_height) {
    confirmations = await getConfirmations(tx);
  }

  const { txid: id } = tx;

  if (type === "outgoing" && amount < 0) {
    address = incomingAddress;
    type = "incoming";
    amount = -amount;
  }

  //console.log(address, amount, type, blockTime, id, confirmations, fee, "amount");

  return { address, amount, type, blockTime, id, confirmations, fee };
};*/



