import {
  AlertDialog,
  Box,
  Button,
  Center,
  HStack,
  Modal,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { getCachedTx } from '../../scripts/helpers/storage';
import { decodeRawPsbt } from '../../scripts/helpers/wallet';

export function ClientPSBT({
  params,
  connectedClient,
  connectedAddressIndex: selectedAddressIndex,
  handleResponse,
}) {
  const {
    origin,
    rawTx,
    indexes: indexesParam,
    signOnly,
    partial,
    sighashType,
  } = params;

  const [psbt, setPsbt] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [devAmount, setDevAmount] = useState(0);
  const [devFee, setDevFee] = useState(0.0);
  const [indexes] = useState([indexesParam].flat());

  useEffect(() => {
    if (typeof selectedAddressIndex !== 'number') return;
    try {
      setPsbt(decodeRawPsbt(rawTx));
      sendMessage(
        {
          message: MESSAGE_TYPES.SIGN_PSBT,
          data: {
            rawTx,
            indexes,
            selectedAddressIndex,
            feeOnly: true,
            partial,
            sighashType,
          },
        },
        ({ fee }) => {
          console.log('fee', fee);
          if (fee) {
            setDevFee(fee);
          }
        }
      );
    } catch (error) {
      handleFailedTransaction({
        title: 'Error',
        description: 'Invalid PSBT',
      });
    }
  }, [
    handleFailedTransaction,
    rawTx,
    indexes,
    selectedAddressIndex,
    partial,
    sighashType,
  ]);

  useEffect(() => {
    (async () => {
      if (psbt) {
        let amount = 0;
        const mappedInputs = await Promise.all(
          psbt?.txInputs?.map(async (input, index) => {
            const hash = Buffer.from(input.hash.reverse());
            const txid = hash.toString('hex');
            const tx = await getCachedTx(txid);
            const value = sb.toBitcoin(tx.vout[input.index].value);

            if (indexes.includes(index)) {
              amount += Number(tx.vout[input.index].value);
            }

            return {
              txid,
              value,
              inputIndex: index,
              vout: input.index,
            };
          })
        );

        if (!partial) {
          // Subtract change output
          psbt?.txOutputs?.forEach((output) => {
            if (output.address === connectedClient.address) {
              amount -= Number(output.value);
            }
          });
        } else {
          switch (sighashType) {
            case 1:
              psbt?.txOutputs?.forEach((output) => {
                if (output.address === connectedClient.address) {
                  amount -= Number(output.value);
                }
              });
              break;
            case 3:
              psbt?.txOutputs?.forEach((output, index) => {
                if (
                  output.address === connectedClient.address &&
                  indexes.includes(index)
                ) {
                  amount -= Number(output.value);
                }
              });
              break;
            case 128:
              psbt?.txOutputs?.forEach((output) => {
                if (output.address === connectedClient.address) {
                  amount -= Number(output.value);
                }
              });
              break;
            case 129:
              psbt?.txOutputs?.forEach((output) => {
                if (output.address === connectedClient.address) {
                  amount -= Number(output.value);
                }
              });
              break;
            case 131:
              psbt?.txOutputs?.forEach((output, index) => {
                if (
                  output.address === connectedClient.address &&
                  indexes.includes(index)
                ) {
                  amount -= Number(output.value);
                }
              });
              break;
            default:
              break;
          }

          psbt?.txOutputs?.forEach((output, index) => {
            if (indexes.includes(index)) {
              amount -= Number(output.value);
            }
          });
        }

        setDevAmount(sb.toBitcoin(amount));
        setInputs(mappedInputs);
      }
    })();
  }, [connectedClient.address, psbt, indexes, partial, sighashType]);

  const outputs = psbt?.txOutputs?.map((output, index) => {
    return {
      outputIndex: index,
      address: output.address,
      value: sb.toBitcoin(output.value),
    };
  });

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const handleFailedTransaction = useCallback(
    ({
      title = 'Transaction Failed',
      description = 'Error creating transaction',
    }) => {
      setLoading(false);
      handleResponse({
        toastMessage: description,
        toastTitle: title,
        error: 'Error creating transaction',
      });
    },
    [handleResponse]
  );

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: `MyDev failed to authorize the transaction to ${origin}`,
      toastTitle: 'Transaction Rejected',
      error: 'User refused transaction',
    });
  }, [handleResponse, origin]);

  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SIGN_PSBT,
        data: {
          rawTx,
          indexes,
          selectedAddressIndex,
          partial,
          sighashType,
        },
      },
      ({ rawTx: signedRawTx, fee, amount }) => {
        if (signedRawTx && fee && amount) {
          if (!signOnly) {
            sendMessage(
              {
                message: MESSAGE_TYPES.SEND_PSBT,
                data: { rawTx: signedRawTx, selectedAddressIndex },
              },
              (txId) => {
                setLoading(false);
                if (txId) {
                  handleResponse({
                    toastMessage: 'Transaction Sent',
                    toastTitle: 'Success',
                    data: { txId },
                  });
                } else {
                  handleFailedTransaction({
                    title: 'Error',
                    description: 'Failed to send transaction.',
                  });
                }
              }
            );
          } else if (signedRawTx) {
            handleResponse({
              toastMessage: 'Transaction Signed',
              toastTitle: 'Success',
              data: { signedRawTx },
            });
          } else {
            handleFailedTransaction({
              title: 'Error',
              description: 'Failed to sign transaction.',
            });
          }
        } else if (signedRawTx && partial) {
          handleResponse({
            toastMessage: 'Psbt Signed',
            toastTitle: 'Success',
            data: { signedRawTx },
          });
        } else {
          handleFailedTransaction({
            title: 'Error',
            description: 'Unable to create psbt transaction',
          });
        }
      }
    );
  }, [
    rawTx,
    indexes,
    selectedAddressIndex,
    handleResponse,
    handleFailedTransaction,
    signOnly,
    partial,
    sighashType,
  ]);

  const [inputsModalOpen, setInputsModalOpen] = useState(false);
  const [outputsModalOpen, setOutputsModalOpen] = useState(false);

  if (!psbt) {
    return null;
  }

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <Center pt='16px' w='300px'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          {signOnly ? 'Sign' : 'Send'} PSBT
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='10px' />
        <HStack py='20px' justifyContent='center' space='16px' mt='-10px'>
          {inputs?.length ? (
            <Pressable onPress={() => setInputsModalOpen(true)}>
              <Text
                fontSize='14px'
                fontWeight='semibold'
                color='gray.400'
                underline={{ textDecorationLine: 'underline' }}
              >
                Inputs ({inputs.length})
              </Text>
            </Pressable>
          ) : null}
          {outputs?.length ? (
            <Pressable onPress={() => setOutputsModalOpen(true)}>
              <Text
                fontSize='14px'
                fontWeight='semibold'
                color='gray.400'
                underline={{ textDecorationLine: 'underline' }}
              >
                Outputs ({outputs.length})
              </Text>
            </Pressable>
          ) : null}
        </HStack>

        <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
          Dev{devAmount}
        </Text>
        <Text fontSize='13px' fontWeight='semibold' pt='6px'>
          Network fee Dev{devFee}
        </Text>
        <HStack alignItems='center' mt='60px' space='12px'>
          <BigButton
            onPress={onRejectTransaction}
            variant='secondary'
            px='20px'
          >
            Cancel
          </BigButton>
          <BigButton
            onPress={() => setConfirmationModalOpen(true)}
            type='submit'
            role='button'
            px='28px'
          >
            {signOnly ? 'Sign' : 'Send'}
          </BigButton>
        </HStack>
      </Center>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        onSubmit={onSubmit}
        loading={loading}
        devAmount={devAmount}
        signOnly={signOnly}
      />
      <Modal
        isOpen={inputsModalOpen}
        onClose={() => setInputsModalOpen(false)}
        size='xl'
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Inputs</Modal.Header>
          <Modal.Body alignItems='center'>
            <ScrollView>
              <VStack space='16px'>
                {inputs.map(({ inputIndex, txid, vout, value }) => (
                  <VStack
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    key={inputIndex}
                  >
                    <Text
                      fontSize='14px'
                      fontWeight='bold'
                      paddingBottom='10px'
                    >
                      Input Index {inputIndex}
                    </Text>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Transaction ID
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                        width='300px'
                      >
                        {txid}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.500'
                      >
                        Vout
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.700'
                      >
                        {vout}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Value
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        {value}
                      </Text>
                    </VStack>
                  </VStack>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Modal
        isOpen={outputsModalOpen}
        onClose={() => setOutputsModalOpen(false)}
        size='xl'
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Outputs</Modal.Header>
          <Modal.Body alignItems='center'>
            <ScrollView>
              <VStack space='16px'>
                {outputs.map(({ outputIndex, address, value }) => (
                  <VStack
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    w='300px'
                    key={outputIndex}
                  >
                    <Text fontSize='14px' fontWeight='bold' paddingBottom='6px'>
                      Output Index {outputIndex}
                    </Text>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Address:{' '}
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                        width='300px'
                      >
                        {address}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Value
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        {value}
                      </Text>
                    </VStack>
                  </VStack>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  origin,
  onSubmit,
  loading,
  devAmount,
  signOnly,
}) => {
  const cancelRef = useRef();

  return (
    <>
      <Modal isOpen={loading} full>
        <Modal.Body h='600px' justifyContent='center'>
          <Spinner size='lg' />
        </Modal.Body>
      </Modal>
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={showModal}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Confirm Transaction</AlertDialog.Header>
          <AlertDialog.Body alignItems='center'>
            <OriginBadge origin={origin} mb='8px' />
            <VStack alignItems='center'>
              <Text>
                Confirm transaction to {signOnly ? 'sign' : 'send'}{' '}
                <Text fontWeight='bold'>Dev{devAmount}</Text>
              </Text>
            </VStack>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant='unstyled'
                colorScheme='coolGray'
                onPress={onClose}
                ref={cancelRef}
                disabled={loading}
              >
                Cancel
              </Button>
              <BigButton onPress={onSubmit} px='24px' loading={loading}>
                Confirm
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
