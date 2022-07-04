contract;

use std::{
    logging::log,
    address::Address,
    assert::require,
    chain::auth::{AuthError, msg_sender},
    context::{call_frames::{contract_id, msg_asset_id}, msg_amount, this_balance},
    contract_id::ContractId,
    identity::Identity,
    result::*,
    revert::revert,
    storage::StorageMap,
    token::transfer_to_output,
};

enum Error {
    EscrowNotInitialized: (),
    IncorrectEscrowState: (),
    IncorrectReceiver: (),
    IncorrectAssetReceived: (),
    InsufficientAmountReceived: (),
}

struct EscrowInstance {
    creator: Address,
    receiver: Address,
    creator_asset_id: ContractId,
    creator_asset_amount: u64,
    requested_asset_id: ContractId,
    requested_asset_amount: u64,
    status: u64, // 0: not init, 1: completed, 2: reverted
}

storage {
    escrows: StorageMap<u64, EscrowInstance>,
    escrow_index: u64,
}

abi Escrow {
    #[storage(read, write)]
    fn create(receiver: Address, requested_asset_id: ContractId, requested_asset_amount: u64) -> u64;
    #[storage(read, write)]
    fn accept(escrow_id: u64);
    #[storage(read, write)]
    fn revert(escrow_id: u64);
}

impl Escrow for Contract {
    #[storage(read, write)]
    fn create(receiver: Address, requested_asset_id: ContractId, requested_asset_amount: u64) -> u64 {
        let sender: Result<Identity, AuthError> = msg_sender();

        if let Identity::Address(address) = sender.unwrap() {
            let account = EscrowInstance {
                creator: address,
                creator_asset_id: msg_asset_id(),
                creator_asset_amount: msg_amount(),
                receiver,
                requested_asset_id,
                requested_asset_amount,
                status: 0,
            };
            storage.escrows.insert(storage.escrow_index, account);
            storage.escrow_index += 1;
        } else {
            revert(0);
        };

        (storage.escrow_index - 1)
    }

    #[storage(read, write)]
    fn accept(escrow_id: u64) {
        let mut escrow_instance = storage.escrows.get(escrow_id);

        require(escrow_instance.status == 0, Error::IncorrectEscrowState);
        require(escrow_instance.requested_asset_id == msg_asset_id(), Error::IncorrectAssetReceived);
        require(escrow_instance.requested_asset_amount <= msg_amount(), Error::InsufficientAmountReceived);

        let sender: Result<Identity, AuthError> = msg_sender();

        if let Identity::Address(address) = sender.unwrap() {
            require(escrow_instance.receiver == address, Error::IncorrectReceiver);
            escrow_instance.status = 1;
            storage.escrows.insert(escrow_id, escrow_instance);
            transfer_to_output(escrow_instance.requested_asset_amount, escrow_instance.requested_asset_id, escrow_instance.creator);
            transfer_to_output(escrow_instance.creator_asset_amount, escrow_instance.creator_asset_id, escrow_instance.receiver);

        } else {
            revert(0);
        };
    }

    #[storage(read, write)]
    fn revert(escrow_id: u64) {
        let mut escrow_instance = storage.escrows.get(escrow_id);

        require(escrow_instance.status == 0, Error::IncorrectEscrowState);

        let sender: Result<Identity, AuthError> = msg_sender();

        if let Identity::Address(address) = sender.unwrap() {
            require(escrow_instance.creator == address, Error::IncorrectReceiver);
            escrow_instance.status = 2;
            storage.escrows.insert(escrow_id, escrow_instance);
            transfer_to_output(escrow_instance.creator_asset_amount, escrow_instance.creator_asset_id, escrow_instance.creator);
        } else {
            revert(0);
        };
    }
}
