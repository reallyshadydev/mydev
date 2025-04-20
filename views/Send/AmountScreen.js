import {
  Avatar,
  Box,
  Button,
  Center,
  HStack,
  Input,
  Text,
  Toast,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { IoSwapVerticalOutline } from 'react-icons/io5';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { ToastRender } from '../../components/ToastRender';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { validateTransaction } from '../../scripts/helpers/wallet';
import { sanitizeDevInput } from '../../utils/formatters';

const MAX_CHARACTERS = 10000;
const REFRESH_INTERVAL = 10000;

export const AmountScreen = ({
  setFormPage,
  errors,
  setErrors,
  setFormData,
  formData,
  walletAddress,
  selectedAddressIndex,
}) => {
  const [isCurrencySwapped, setIsCurrencySwapped] = useState(false);
  const [dogecoinevPrice, setDogecoinevPrice] = useState(0);
  const [addressBalance, setAddressBalance] = useState();
  const devInputRef = useRef(null);
  const fiatInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const getDogecoinevPrice = useCallback(() => {
    sendMessage({ message: MESSAGE_TYPES.GET_DOGECOINEV_PRICE }, ({ usd }) => {
      if (usd) {
        setDogecoinevPrice(usd);
        onChangeTextDev(formData.devAmount);
      }
    });
  }, [formData.devAmount, onChangeTextDev]);

  useEffect(() => {
    getAddressBalance();
  }, [getAddressBalance, walletAddress]);

  const getAddressBalance = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
      (balance) => {
        if (balance) {
          setAddressBalance(balance);
        }
      }
    );
  }, [walletAddress]);

  useInterval(
    () => {
      getDogecoinevPrice();
      getAddressBalance();
    },
    REFRESH_INTERVAL,
    true
  );

  const onChangeTextDev = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }

      setErrors({ ...errors, devAmount: '' });

      const cleanText = sanitizeDevInput(text) || '0';

      if (cleanText.length > MAX_CHARACTERS) {
        return;
      }

      const cleanDev = parseFloat(cleanText);
      let newFiatValue = 0;

      if (cleanDev > 0) {
        newFiatValue = (cleanDev * dogecoinevPrice).toFixed(2);
      }

      setFormData({
        ...formData,
        devAmount: cleanText,
        fiatAmount: String(newFiatValue),
      });
    },
    [dogecoinevPrice, errors, formData, setErrors, setFormData]
  );

  const onChangeTextFiat = useCallback(
    (text) => {
      if (Number.isNaN(Number(text))) {
        return;
      }

      setErrors({ ...errors, fiatAmount: '' });

      const cleanText = sanitizeDevInput(text, 2) || '0';

      if (cleanText.length > MAX_CHARACTERS) {
        return;
      }

      const cleanFiat = parseFloat(cleanText);
      let newDevValue = 0;

      if (cleanFiat > 0) {
        newDevValue = (cleanFiat / dogecoinevPrice).toFixed(8);
      }

      setFormData({
        ...formData,
        fiatAmount: cleanText, // This keeps the exact entered format
        devAmount: String(newDevValue),
      });
    },
    [dogecoinevPrice, errors, formData, setErrors, setFormData]
  );

  const swapInput = useCallback(() => {
    setIsCurrencySwapped((state) => !state);
  }, []);

  const onSetMax = useCallback(() => {
    onChangeTextDev(String(sb.toBitcoin(addressBalance)));
  }, [addressBalance, onChangeTextDev]);

  const onSubmit = useCallback(() => {
    setLoading(true);
    const txData = {
      senderAddress: walletAddress,
      recipientAddress: formData.address?.trim(),
      devAmount: formData.devAmount,
      feeRate: formData.feeRate,
    };
    const error = validateTransaction({
      ...txData,
      addressBalance,
    });
    if (error) {
      setErrors({ ...errors, devAmount: error });
      setLoading(false);
    } else {
      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_TRANSACTION,
          data: txData,
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
    addressBalance,
    errors,
    formData,
    setErrors,
    setFormData,
    setFormPage,
    walletAddress,
  ]);

  return (
    <Center>
      <Text fontSize='sm' color='gray.500' textAlign='center' mb='8px'>
        <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
          Address {selectedAddressIndex + 1}
        </Text>
        {'  '}
        {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-4)}
      </Text>
      <Text fontSize='xl' pb='4px' textAlign='center' fontWeight='semibold'>
        Paying
      </Text>
      <HStack alignItems='center' space='12px' pb='28px'>
        <Avatar size='sm' bg='brandYellow.500' _text={{ color: 'gray.800' }}>
          {formData.address?.substring(0, 2)}
        </Avatar>
        <Text
          fontSize='md'
          fontWeight='semibold'
          color='gray.500'
          textAlign='center'
        >
          {formData.address?.slice(0, 8)}...{formData.address?.slice(-4)}
        </Text>
      </HStack>
      <Box
        justifyContent='center'
        alignItems='center'
        pt='14px'
        pb='8px'
        w='80%'
        h='70px'
      >
        {!isCurrencySwapped ? (
          <>
            <Input
              keyboardType='numeric'
              // isDisabled={dogecoinevPrice === 0}
              variant='filled'
              placeholder='0'
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
              isInvalid={errors.devAmount}
              onChangeText={onChangeTextDev}
              onSubmitEditing={onSubmit}
              autoFocus
              type='number'
              fontSize='24px'
              fontWeight='semibold'
              _input={{
                py: '10px',
                pl: '4px',
                type: 'number',
              }}
              InputLeftElement={
                <Text fontSize='24px' fontWeight='semibold' px='4px'>
                  DEV
                </Text>
              }
              textAlign='center'
              ref={devInputRef}
              value={formData.devAmount}
              position='absolute'
              top={0}
            />
            {/*<Input
              keyboardType='numeric'
              variant='filled'
              placeholder='Fee Rate, min 1000'
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
                  currentValue < 1000
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    feeRate: 1000,
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
              position='absolute'
              top='60px'
              size='sm'
            />*/}
          </>
        ) : (
          <>
            <Input
              keyboardType='numeric'
              variant='filled'
              placeholder='0'
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
              isInvalid={errors.devAmount}
              onChangeText={onChangeTextFiat}
              onSubmitEditing={onSubmit}
              autoFocus
              type='number'
              fontSize='24px'
              fontWeight='semibold'
              _input={{
                py: '10px',
                pl: '4px',
                type: 'number',
              }}
              InputLeftElement={
                <Text fontSize='24px' fontWeight='semibold' px='4px'>
                  $
                </Text>
              }
              textAlign='center'
              ref={fiatInputRef}
              value={formData.fiatAmount}
              position='absolute'
              top={0}
              allowFontScaling
              adjustsFontSizeToFit
            />
            <Input
              keyboardType='numeric'
              variant='filled'
              placeholder='Fee Rate, min 1000'
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
                  currentValue < 1000
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    feeRate: 1000,
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
              position='absolute'
              top='60px'
              size='sm'
            />
          </>
        )}
      </Box>

      <Text fontSize='10px' color='red.500'>
        {errors.devAmount || ' '}
      </Text>
      <BigButton
        variant='secondary'
        px='6px'
        py='4px'
        rounded='10px'
        mt='18px'
        mb='4px'
        onPress={swapInput}
      >
        <IoSwapVerticalOutline size='22px' style={{ paddingTop: 3 }} />
      </BigButton>
      <Text fontSize='20px' fontWeight='semibold' color='gray.500' pt='6px'>
        {!isCurrencySwapped ? '$' : 'Dev'}
        {isCurrencySwapped
          ? formData.devAmount || 0
          : formData.fiatAmount || 0}
      </Text>
      <HStack alignItems='center' pt='12px' space='8px'>
        {addressBalance ? (
          <Text fontSize='14px' color='gray.500'>
            Balance: DEV-{sb.toBitcoin(addressBalance)}
          </Text>
        ) : null}
        <Button
          background='gray.400'
          px='6px'
          h='20px'
          rounded='6px'
          _hover={{ background: 'gray.500' }}
          onPress={onSetMax}
        >
          Max
        </Button>
      </HStack>
      <HStack alignItems='center' mt='60px' space='12px'>
        <Button
          variant='unstyled'
          colorScheme='coolGray'
          onPress={() => setFormPage('address')}
        >
          Back
        </Button>
        <BigButton
          onPress={onSubmit}
          type='submit'
          role='button'
          px='28px'
          isDisabled={
            !Number(formData.devAmount) ||
            !addressBalance ||
            errors.devAmount //||
            //!Number(formData.feeRate) ||
            //Number(formData.feeRate) < 1000
          }
          loading={loading}
        >
          Next
        </BigButton>
      </HStack>
    </Center>
  );
};
