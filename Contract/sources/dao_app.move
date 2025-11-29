#[allow(duplicate_alias)]
module dao_app::dao_app;

use sui::object::ID;
use sui::tx_context::TxContext;
use std::string::String;
use std::option::Option;
use dao_app::commity::{Self, Commity};
use dao_app::profile::{Self, Profile};
use dao_app::event_nft::{Self, EventNFT};
use dao_app::member_stats::{Self, MemberStats};
use dao_app::proposal::{Self, Proposal};
use dao_app::voting;
use sui::clock::{Self, Clock};

fun init(_ctx: &mut TxContext) {
}

/// Create a new community
#[allow(lint(public_entry))]
public entry fun create_commity(name: String, ctx: &mut TxContext) {
    commity::create(name, ctx);
}


/// Create a new profile for the sender
#[allow(lint(public_entry))]
public entry fun create_profile(nickname: String, ctx: &mut TxContext) {
    profile::create(nickname, ctx);
}


/// Join a community by adding the profile owner to the community's member list
#[allow(lint(public_entry))]
public entry fun join_commity(
    profile: &mut Profile,
    commity: &mut Commity,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(profile::is_owner(profile, sender), 0);
    commity::add_member(commity, sender);
    let commity_id = commity::id(commity);
    profile::init_member_stats(profile, commity_id);
}


/// Mint an event NFT that can be redeemed for XP
public fun mint_event_nft(
    commity_id: ID,
    xp: u64,
    recipient: address,
    ctx: &mut TxContext
): EventNFT {
    event_nft::mint(commity_id, xp, recipient, ctx)
}

/// Mint and transfer an event NFT
#[allow(lint(public_entry))]
public entry fun mint_and_transfer_event_nft(
    commity_id: ID,
    xp: u64,
    recipient: address,
    ctx: &mut TxContext
) {
    event_nft::mint_and_transfer(commity_id, xp, recipient, ctx);
}

/// Redeem an event NFT for XP, adding it to the profile's membership stats
#[allow(lint(public_entry))]
public entry fun redeem_nft_for_xp(
    profile: &mut Profile,
    event_nft: EventNFT,
    commity_id: ID,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(profile::is_owner(profile, sender), 0);
    assert!(event_nft::is_owner(&event_nft, sender), 1);
    assert!(event_nft::commity_id(&event_nft) == commity_id, 2);
    let stats = profile::get_or_create_member_stats(profile, commity_id);
    let xp_amount = event_nft::xp(&event_nft);
    member_stats::add_xp(stats, xp_amount);
    event_nft::destroy(event_nft);
}


/// Check if an address is a member of a community
public fun is_member(commity: &Commity, member: address): bool {
    commity::is_member(commity, member)
}

/// Get member stats for a profile in a specific community
public fun get_member_stats(profile: &Profile, commity_id: ID): Option<MemberStats> {
    profile::get_member_stats(profile, commity_id)
}


/// Create a proposal from a message
#[allow(lint(public_entry))]
public entry fun create_proposal(
    commity: &Commity,
    message_id: ID,
    title: String,
    description: String,
    deadline: u64,
    quorum_threshold: u64,
    ctx: &mut TxContext
) {
    proposal::create(commity, message_id, title, description, deadline, quorum_threshold, ctx);
}


/// Cast a vote on a proposal with level-based weight
#[allow(lint(public_entry))]
public entry fun cast_vote(
    profile: &Profile,
    proposal: &mut Proposal,
    commity: &Commity,
    vote_type: u8,
    clock: &Clock,
    ctx: &TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(profile::is_owner(profile, sender), 0);
    assert!(commity::is_member(commity, sender), 1);
    let commity_id = commity::id(commity);
    assert!(proposal::commity_id(proposal) == commity_id, 2);
    let stats_opt = profile::get_member_stats(profile, commity_id);
    assert!(std::option::is_some(&stats_opt), 3);
    let stats = *std::option::borrow(&stats_opt);
    let level = member_stats::get_level(&stats);
    let vote_weight = voting::calculate_vote_weight(level);
    let timestamp = clock::timestamp_ms(clock);
    let vote = voting::new(sender, vote_type, vote_weight, timestamp);
    proposal::cast_vote(proposal, vote, clock);
}

/// Finalize a proposal and calculate result
#[allow(lint(public_entry))]
public entry fun finalize_proposal(
    proposal: &mut Proposal,
    clock: &Clock
) {
    proposal::finalize(proposal, clock);
}

/// Update proposal status if expired
#[allow(lint(public_entry))]
public entry fun update_proposal_status(
    proposal: &mut Proposal,
    clock: &Clock
) {
    proposal::update_status_if_expired(proposal, clock);
}
