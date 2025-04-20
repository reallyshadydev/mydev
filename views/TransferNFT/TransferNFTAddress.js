import { Box, Input, Text, Toast, VStack } from 'native-base';
import { useCallback, useState } from 'react';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';
import { NFTView } from '../Transactions/components/NFTView';

export const TransferNFTAddress = ({
  walletAddress,
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  selectedNFT,
}) => {
  const [loading, setLoading] = useState(false);
  const onChangeText = useCallback(
    (text) => {
      setErrors({});
      setFormData({ ...formData, address: text });
    },
    [formData, setErrors, setFormData]
  );

  const validate = useCallback(() => {
    if (!validateAddress(formData.address.trim())) {
      setErrors({
        ...errors,
        address: 'Invalid address',
      });
      return false;
    } else if (formData.address.trim() === walletAddress) {
      setErrors({
        ...errors,
        address: 'Cannot send to yourself',
      });
      return false;
    }
    setErrors({});
    return formData.feeRate && Number(formData.feeRate) >= 5000;
  }, [errors, formData.address, formData.feeRate, setErrors, walletAddress]);

  const onSubmit = useCallback(() => {
    if (validate()) {
      setLoading(true);

      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_NFT_TRANSACTION,
          data: {
            ...selectedNFT,
            address: walletAddress,
            recipientAddress: formData.address.trim(),
            feeRate: formData.feeRate,
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
            setFormPage('confirmation');
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
    }
  }, [
    formData,
    selectedNFT,
    setFormData,
    setFormPage,
    validate,
    walletAddress,
  ]);

  return (
    <Box display='flex' flexDirection='column' alignItems='center' px='20px'>
      <Text fontSize='xl' pb='16px' textAlign='center' fontWeight='semibold'>
        Transfer NFT
      </Text>

      <Box borderRadius='12px' overflow='hidden' mb='24px' w='100%'>
        <NFTView nft={selectedNFT} />
      </Box>

      <VStack spacing={4} w='100%'>
        <Box w='100%'>
          <Input
            variant='filled'
            placeholder='Recipient wallet address'
            py='14px'
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
            isInvalid={'address' in errors}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            autoFocus
            type='number'
            value={formData.address}
            backgroundColor='gray.100'
          />
          <Text fontSize='10px' color='red.500' pt='6px'>
            {errors.address || ' '}
          </Text>
        </Box>

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
            isInvalid={errors.feeRate}
            onChangeText={(value) => {
              const numValue = parseInt(value, 10);
              if (!Number.isNaN(numValue) && numValue >= 0) {
                setFormData((prev) => ({
                  ...prev,
                  feeRate: numValue,
                }));
              }
            }}
            onBlur={() => {
              const currentValue = parseInt(formData.feeRate, 10);
              if (
                !formData.feeRate ||
                Number.isNaN(currentValue) ||
                currentValue < 5000
              ) {
                setFormData((prev) => ({
                  ...prev,
                  feeRate: 5000,
                }));
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
            value={formData.feeRate}
            size='sm'
          />
        </Box>

        <BigButton
          onPress={onSubmit}
          w='80%'
          type='submit'
          role='button'
          mt='32px'
          isDisabled={!formData.address || formData.address.length <= 26}
          loading={loading}
        >
          Next
        </BigButton>
      </VStack>
    </Box>
  );
};
