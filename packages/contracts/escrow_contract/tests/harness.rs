use fuels::signers::wallet::Wallet;
use fuels::{prelude::*, tx::ContractId};
use fuels_abigen_macro::abigen;
use rand::prelude::{Rng, SeedableRng, StdRng};

struct WalletAndInstance {
    escrow: Escrow,
    wallet: LocalWallet,
}
// Load abi from json
abigen!(Escrow, "out/debug/escrow_contract-abi.json");
abigen!(Asset, "tests/artifacts/asset/out/debug/asset-abi.json");

async fn setup_tests() -> (
    WalletAndInstance,
    WalletAndInstance,
    WalletAndInstance,
    ContractId,
    ContractId,
    ContractId,
) {
    let num_wallets = 3;
    let coins_per_wallet = 1;
    let amount_per_coin = 1_000_000;

    let config = WalletsConfig::new(
        Some(num_wallets),
        Some(coins_per_wallet),
        Some(amount_per_coin),
    );
    let mut wallets = launch_provider_and_get_wallets(config).await;

    let deployer = wallets.pop().unwrap();
    let creator = wallets.pop().unwrap();
    let receiver = wallets.pop().unwrap();

    let rng = &mut StdRng::seed_from_u64(2322u64);
    let salt: [u8; 32] = rng.gen();

    let creator_asset_id = Contract::deploy_with_salt(
        "./tests/artifacts/asset/out/debug/asset.bin",
        &deployer,
        TxParameters::default(),
        Salt::from(salt),
    )
    .await
    .unwrap();

    let salt: [u8; 32] = rng.gen();
    let receiver_asset_id = Contract::deploy_with_salt(
        "./tests/artifacts/asset/out/debug/asset.bin",
        &deployer,
        TxParameters::default(),
        Salt::from(salt),
    )
    .await
    .unwrap();

    let creator_asset_instance = Asset::new(creator_asset_id.to_string(), deployer.clone());
    let receiver_asset_instance = Asset::new(receiver_asset_id.to_string(), deployer.clone());

    creator_asset_instance
        .mint_and_send_to_address(1_000_000, creator.address().clone())
        .append_variable_outputs(1)
        .call()
        .await
        .unwrap()
        .value;
    receiver_asset_instance
        .mint_and_send_to_address(1_000_000, receiver.address().clone())
        .append_variable_outputs(1)
        .call()
        .await
        .unwrap()
        .value;

    let escrow_contract_id = Contract::deploy(
        "./out/debug/escrow_contract.bin",
        &deployer,
        TxParameters::default(),
    )
    .await
    .unwrap();

    let deployer = WalletAndInstance {
        escrow: Escrow::new(escrow_contract_id.to_string(), deployer.clone()),
        wallet: deployer,
    };

    let creator = WalletAndInstance {
        escrow: Escrow::new(escrow_contract_id.to_string(), creator.clone()),
        wallet: creator,
    };

    let receiver = WalletAndInstance {
        escrow: Escrow::new(escrow_contract_id.to_string(), receiver.clone()),
        wallet: receiver,
    };

    (
        deployer,
        creator,
        receiver,
        escrow_contract_id,
        creator_asset_id,
        receiver_asset_id,
    )
}

async fn get_contract_instance(wallet: Wallet) -> (Escrow, ContractId) {
    // Launch a local network and deploy the contract

    let id = Contract::deploy(
        "./out/debug/escrow_contract.bin",
        &wallet,
        TxParameters::default(),
    )
    .await
    .unwrap();

    let instance = Escrow::new(id.to_string(), wallet);

    (instance, id)
}

#[tokio::test]
async fn can_initialize_contract() {
    let wallet = launch_provider_and_get_single_wallet().await;
    let (_, _) = get_contract_instance(wallet).await;
}

#[tokio::test]
async fn can_initalize_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 1_000;
    let requested_amount = 1_000;

    let tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let call_params = CallParameters::new(
        Some(creator_asset_amount),
        Some(AssetId::from(*creator_asset_id)),
    );

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let result = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(tx_params)
        .call_params(call_params)
        .call()
        .await
        .unwrap();

    assert_eq!(result.value, 0);
}

#[tokio::test]
async fn can_initalize_multiple_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 100;
    let requested_amount = 100;

    let tx_params_one = TxParameters::new(None, Some(1_000_000), None, None);
    let call_params_one = CallParameters::new(
        Some(creator_asset_amount),
        Some(AssetId::from(*creator_asset_id)),
    );

    let tx_params_two = TxParameters::new(None, Some(1_000_000), None, None);
    let call_params_two = CallParameters::new(
        Some(creator_asset_amount),
        Some(AssetId::from(*creator_asset_id)),
    );

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let result_one = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(tx_params_one)
        .call_params(call_params_one)
        .call()
        .await
        .unwrap();

    let result_two = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(tx_params_two)
        .call_params(call_params_two)
        .call()
        .await
        .unwrap();

    assert_eq!(result_one.value, 0);
    assert_eq!(result_two.value, 1);
}

#[tokio::test]
#[should_panic(expected = "Revert(42)")]
async fn panics_on_accepting_nonexistent_escrow() {
    let (_, _, receiver, _, _, _) = setup_tests().await;

    receiver.escrow.accept(10).call().await.unwrap();
}

#[tokio::test]
async fn can_accept_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 100;
    let requested_amount = 100;

    let creator_asset_id = Some(AssetId::from(*creator_asset_id)).unwrap();
    let receiver_asset_id = Some(AssetId::from(*receiver_asset_id)).unwrap();

    let creator_initial_creator_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let creator_initial_receiver_balance = creator
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    let receiver_initial_creator_balance = receiver
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let receiver_initial_receiver_balance = receiver
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    assert_eq!(creator_initial_receiver_balance, 0);
    assert_eq!(receiver_initial_creator_balance, 0);

    let create_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let create_call_params =
        CallParameters::new(Some(creator_asset_amount), Some(creator_asset_id));

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let create_result = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(create_tx_params)
        .call_params(create_call_params)
        .call()
        .await
        .unwrap();

    let creator_current_creator_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let creator_current_receiver_balance = creator
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    let receiver_current_creator_balance = receiver
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let receiver_current_receiver_balance = receiver
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    assert_eq!(create_result.value, 0);
    assert_eq!(
        creator_current_creator_balance,
        creator_initial_creator_balance
            .checked_sub(creator_asset_amount)
            .unwrap()
    );
    assert_eq!(
        creator_current_receiver_balance,
        creator_initial_receiver_balance
    );
    assert_eq!(
        receiver_current_receiver_balance,
        receiver_initial_receiver_balance
    );
    assert_eq!(
        receiver_current_creator_balance,
        receiver_initial_creator_balance
    );

    let receive_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let receive_call_params = CallParameters::new(Some(requested_amount), Some(receiver_asset_id));

    receiver
        .escrow
        .accept(create_result.value)
        .tx_params(receive_tx_params)
        .call_params(receive_call_params)
        .append_variable_outputs(2)
        .call()
        .await
        .unwrap();

    let creator_current_creator_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let creator_current_receiver_balance = creator
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    let receiver_current_creator_balance = receiver
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    let receiver_current_receiver_balance = receiver
        .wallet
        .get_asset_balance(&receiver_asset_id)
        .await
        .unwrap();

    assert_eq!(
        creator_current_creator_balance,
        creator_initial_creator_balance
            .checked_sub(creator_asset_amount)
            .unwrap()
    );
    assert_eq!(
        creator_current_receiver_balance,
        creator_initial_receiver_balance
            .checked_add(requested_amount)
            .unwrap()
    );
    assert_eq!(
        receiver_current_receiver_balance,
        receiver_initial_receiver_balance
            .checked_sub(requested_amount)
            .unwrap()
    );
    assert_eq!(
        receiver_current_creator_balance,
        receiver_initial_creator_balance
            .checked_add(creator_asset_amount)
            .unwrap()
    );
}

#[tokio::test]
async fn can_revert_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 100;
    let requested_amount = 100;
    let creator_asset_id = Some(AssetId::from(*creator_asset_id)).unwrap();
    let initial_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();

    let create_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let create_call_params =
        CallParameters::new(Some(creator_asset_amount), Some(creator_asset_id));

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let create_result = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(create_tx_params)
        .call_params(create_call_params)
        .call()
        .await
        .unwrap();

    assert_eq!(create_result.value, 0);
    let current_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    assert_eq!(
        current_balance,
        initial_balance.checked_sub(creator_asset_amount).unwrap()
    );

    creator
        .escrow
        .revert(create_result.value)
        .append_variable_outputs(1)
        .call()
        .await
        .unwrap();

    let current_balance = creator
        .wallet
        .get_asset_balance(&creator_asset_id)
        .await
        .unwrap();
    assert_eq!(current_balance, initial_balance);
}

#[tokio::test]
#[should_panic(expected = "Revert(42)")]
async fn panics_on_revert_accepted_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 100;
    let requested_amount = 100;

    let creator_asset_id = Some(AssetId::from(*creator_asset_id)).unwrap();
    let receiver_asset_id = Some(AssetId::from(*receiver_asset_id)).unwrap();

    let create_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let create_call_params =
        CallParameters::new(Some(creator_asset_amount), Some(creator_asset_id));

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let create_result = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(create_tx_params)
        .call_params(create_call_params)
        .call()
        .await
        .unwrap();

    let receive_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let receive_call_params = CallParameters::new(Some(requested_amount), Some(receiver_asset_id));

    receiver
        .escrow
        .accept(create_result.value)
        .tx_params(receive_tx_params)
        .call_params(receive_call_params)
        .append_variable_outputs(2)
        .call()
        .await
        .unwrap();

    creator
        .escrow
        .revert(create_result.value)
        .append_variable_outputs(1)
        .call()
        .await
        .unwrap();
}

#[tokio::test]
#[should_panic(expected = "Revert(42)")]
async fn panics_on_accept_reverted_escrow() {
    let (_, creator, receiver, _, creator_asset_id, receiver_asset_id) = setup_tests().await;

    let creator_asset_amount = 100;
    let requested_amount = 100;

    let creator_asset_id = Some(AssetId::from(*creator_asset_id)).unwrap();
    let receiver_asset_id = Some(AssetId::from(*receiver_asset_id)).unwrap();

    let create_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let create_call_params =
        CallParameters::new(Some(creator_asset_amount), Some(creator_asset_id));

    let receiver_contract_id = ContractId::new(receiver_asset_id.into());

    let create_result = creator
        .escrow
        .create(
            receiver.wallet.address().clone(),
            receiver_contract_id,
            requested_amount,
        )
        .tx_params(create_tx_params)
        .call_params(create_call_params)
        .call()
        .await
        .unwrap();

    let receive_tx_params = TxParameters::new(None, Some(1_000_000), None, None);
    let receive_call_params = CallParameters::new(Some(requested_amount), Some(receiver_asset_id));

    creator
        .escrow
        .revert(create_result.value)
        .append_variable_outputs(1)
        .call()
        .await
        .unwrap();

    receiver
        .escrow
        .accept(create_result.value)
        .tx_params(receive_tx_params)
        .call_params(receive_call_params)
        .append_variable_outputs(2)
        .call()
        .await
        .unwrap();
}
