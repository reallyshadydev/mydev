import {
  Box,
  Button,
  Center,
  FlatList,
  HStack,
  Input,
  Spinner,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useState } from 'react';

import { BigButton } from '../../components/Button';
import { RecipientAddress } from '../../components/RecipientAddress';
import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { getDEV20Inscriptions } from '../../scripts/helpers/devinals';
import { NFT } from '../Transactions/components/NFT';

export const TransferDEV20Amount = ({
  setFormPage,
  setFormData,
  formData,
  walletAddress,
  selectedToken,
  selectedNFT,
  setSelectedNFT,
}) => {
  const [loading, setLoading] = useState(false);
  const [nfts, setNFTs] = useState(null);
  const [feeRate, setFeeRate] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const transfers = await getDEV20Inscriptions(
          walletAddress,
          selectedToken.ticker
        );

        setNFTs(transfers);
      } catch (e) {
        Toast.show({
          title: 'Error',
          description: 'Error loading inscriptions',
          duration: 3000,
          render: () => {
            return (
              <ToastRender
                title='Error'
                description='Error loading inscriptions'
                status='error'
              />
            );
          },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedToken.ticker, walletAddress]);

  const renderItem = useCallback(
    ({ item, index }) => {
      return (
        <NFT
          nft={item}
          index={index}
          onPress={() => {
            setSelectedNFT(item);
          }}
          selected={selectedNFT?.location === item.location}
        />
      );
    },
    [selectedNFT?.location, setSelectedNFT]
  );

  const onSubmit = useCallback(() => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.CREATE_NFT_TRANSACTION,
        data: {
          ...selectedNFT,
          address: walletAddress,
          recipientAddress: formData.address.trim(),
          feeRate,
        },
      },
      ({ rawTx, fee, amount }) => {
        if (rawTx && fee !== undefined && amount) {
          setFormData({
            ...formData,
            rawTx,
            fee,
            devAmount: amount,
          });
          setFormPage('confirmationDEV20');
          setLoading(false);
        } else {
          setLoading(false);
          Toast.show({
            title: 'Error',
            description: 'Error creating transaction',
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Error'
                  description='Error creating transaction'
                  status='error'
                />
              );
            },
          });
        }
      }
    );
  }, [selectedNFT, walletAddress, formData, feeRate, setFormData, setFormPage]);

  return (
    <Box display='flex' flexDirection='column' minH='100vh' w='100%'>
      {/* Header Section */}
      <Box py={4}>
        <WalletAddress />
        <Text fontSize='xl' pb='8px' textAlign='center'>
          Transfer{' '}
          <Text as='span' fontWeight='bold'>
            {selectedToken.ticker}
          </Text>{' '}
          Tokens
        </Text>
        <RecipientAddress address={formData.address} />
      </Box>

      {/* Main Content */}
      <Box flex='1' position='relative'>
        {!nfts ? (
          <Center pt='40px'>
            <Spinner color='amber.400' />
          </Center>
        ) : nfts?.length < 1 ? (
          <VStack pt='48px' alignItems='center'>
            <Text color='gray.500' pt='24px' pb='32px'>
              No transfers found
            </Text>
          </VStack>
        ) : (
          <Box position='relative' h='full'>
            {/* NFT List */}
            <Box pb='80px'>
              {' '}
              {/* Add padding bottom to prevent overlap with footer */}
              <FlatList
                data={nfts}
                renderItem={renderItem}
                keyExtractor={(item) =>
                  `${selectedNFT?.location}${item.location}`
                }
                numColumns={2}
                initialNumToRender={4}
              />
            </Box>

            {/* Footer Section with Controls */}
            <Box
              position='fixed'
              bottom={0}
              left={0}
              right={0}
              bg='white'
              borderTopWidth={1}
              borderTopColor='gray.100'
              py={3}
              px={4}
              shadow='md'
            >
              <VStack spacing={3}>
                {/* Fee Rate Input */}
                <Box w='100%'>
                  <Input
                    keyboardType='numeric'
                    variant='filled'
                    placeholder='Fee Rate, min 5000'
                    focusOutlineColor='brandYellow.500'
                    _hover={{
                      borderColor: 'brandYellow.500',
                    }}
                    _invalid={{
                      borderColor: 'red.500',
                      focusOutlineColor: 'red.500',
                      _hover: {
                        borderColor: 'red.500',
                      },
                    }}
                    onChangeText={(value) => {
                      const numValue = parseInt(value, 10);
                      if (!Number.isNaN(numValue) && numValue >= 0) {
                        setFeeRate(numValue);
                      }
                    }}
                    onBlur={() => {
                      const currentValue = parseInt(feeRate, 10);
                      if (
                        !feeRate ||
                        Number.isNaN(currentValue) ||
                        currentValue < 5000
                      ) {
                        setFeeRate(5000);
                      }
                    }}
                    type='number'
                    fontSize='16px'
                    fontWeight='normal'
                    _input={{
                      py: '6px',
                      pl: '4px',
                      type: 'number',
                    }}
                    InputRightElement={
                      <Text fontSize='12px' color='gray.500' px='4px'>
                        ribbit/vB
                      </Text>
                    }
                    textAlign='center'
                    value={feeRate}
                    size='sm'
                  />
                </Box>

                {/* Action Buttons */}
                <HStack justifyContent='space-between' w='100%'>
                  <Button
                    variant='unstyled'
                    colorScheme='coolGray'
                    onPress={() => {
                      setSelectedNFT(null);
                      setFormPage('address');
                    }}
                  >
                    Back
                  </Button>
                  <BigButton
                    onPress={onSubmit}
                    type='submit'
                    role='button'
                    px='28px'
                    isDisabled={
                      !selectedNFT || !Number(feeRate) || Number(feeRate) < 5000
                    }
                    loading={loading}
                  >
                    Next
                  </BigButton>
                </HStack>
              </VStack>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
