import { useState, useEffect } from 'react';
import { Avatar, HStack, Pressable, Text, VStack } from 'native-base';
import { Fragment } from 'react';
import TimeAgo from 'timeago-react';
import { useAppContext } from '../../../hooks/useAppContext';
import { formatSatoshisAsDev, is69, is420 } from '../../../utils/formatters';

export const Transaction = ({
  //transaction: { address, id, blockTime, type, amount, confirmations },
  transaction,
}) => {
  const { navigate } = useAppContext();

  const [transactionData, setTransactionData] = useState(null);

  useEffect(() => {
    if (transaction instanceof Promise) {
      transaction.then(setTransactionData).catch(console.error);
    } else {
      setTransactionData(transaction);
    }
  }, [transaction]);

  if (!transactionData) {
    return <Text>Loading transaction...</Text>; // Show loading state
  }

  const { address, id, blockTime, type, amount, confirmations } = transactionData;

  //console.log('Resolved transaction:', transactionData);

  //const selectTx = () => {
    //navigate(`/Transactions/tokens?selectedTx=${JSON.stringify(transaction)}`);
  //};
  const selectTx = () => {
    //console.log('Selecting transaction:', transactionData); // Debugging
    if (!transactionData) return; // Prevent navigation if undefined
  
    navigate(`/Transactions/tokens?selectedTx=${JSON.stringify(transactionData)}`);
  };

  return (
    <Fragment key={id}>
      <Pressable onPress={selectTx} paddingTop='10px'>
        <HStack p='2px'>
          <VStack mr='12px'>
            <Avatar
              size='sm'
              bg='brandYellow.500'
              _text={{ color: 'gray.800' }}
            >
              {address?.substring(0, 2)}
            </Avatar>
          </VStack>
          <VStack flex={1}>
            <Text fontSize='xs' fontWeight='medium'>
              {address?.includes('Multiple')
                ? address
                : `${address?.slice(0, 8)}...${address?.slice(-4)}`}
            </Text>

            <HStack space='6px'>
              <Text
                fontSize='12px'
                fontWeight='semibold'
                _light={{ color: 'gray.400' }}
                _dark={{ color: 'gray.500' }}
              >
                {confirmations === 0 ? (
                  'PENDING'
                ) : (
                  <TimeAgo datetime={blockTime * 1000} />
                )}
              </Text>
            </HStack>
          </VStack>
          <VStack flexDirection='row' alignItems='flex-start' ml='8px'>
            <HStack
              _light={{
                bg: type === 'outgoing' ? '#E4F0FF' : '#E0F8E8',
              }}
              _dark={{
                bg: type === 'outgoing' ? '#000643' : '#001109',
              }}
              px='12px'
              py='3px'
              rounded='2xl'
            >
              <Text
                fontSize='12px'
                fontWeight='bold'
                _light={{
                  color: is420(formatSatoshisAsDev(amount, 3))
                    ? 'yellow.600'
                    : type === 'outgoing'
                    ? 'blue.500'
                    : 'yellow.500',
                }}
                _dark={{
                  color: is420(formatSatoshisAsDev(amount, 3))
                    ? 'yellow.300'
                    : type === 'outgoing'
                    ? 'blue.400'
                    : 'yellow.500',
                }}
              >
                {type === 'outgoing' ? '-' : '+'}{' '}
                {formatSatoshisAsDev(amount, 3)}
              </Text>
              <Text fontSize='sm' fontWeight='bold'>
                {is69(formatSatoshisAsDev(amount, 3)) && ' 😏'}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
    </Fragment>
  );
};