#[allow(duplicate_alias)]
module dao_app::proposal;

use sui::object::{UID, ID};
use sui::transfer;
use sui::tx_context::TxContext;
use std::string::String;
use sui::clock::{Self, Clock};
use dao_app::voting::{Self, Vote};
use dao_app::commity::{Self, Commity};

/// Proposal status
const STATUS_ACTIVE: u8 = 0;
const STATUS_PASSED: u8 = 1;
const STATUS_FAILED: u8 = 2;
const STATUS_EXPIRED: u8 = 3;

/// Proposal structure
public struct Proposal has key {
    id: UID,
    commity_id: ID,
    message_id: ID,
    creator: address,
    title: String,
    description: String,
    deadline: u64,
    yes_votes: u64,
    no_votes: u64,
    abstain_votes: u64,
    total_voters: u64,
    status: u8,
    quorum_threshold: u64,
}

/// Create a new proposal
#[allow(lint(public_entry))]
public entry fun create(
    commity: &Commity,
    message_id: ID,
    title: String,
    description: String,
    deadline: u64,
    quorum_threshold: u64,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let commity_id = commity::id(commity);
    
    let proposal = Proposal {
        id: object::new(ctx),
        commity_id,
        message_id,
        creator: sender,
        title,
        description,
        deadline,
        yes_votes: 0,
        no_votes: 0,
        abstain_votes: 0,
        total_voters: 0,
        status: STATUS_ACTIVE,
        quorum_threshold,
    };
    transfer::share_object(proposal);
}

/// Get proposal ID
public fun id(proposal: &Proposal): ID {
    object::id(proposal)
}

/// Get community ID
public fun commity_id(proposal: &Proposal): ID {
    proposal.commity_id
}

/// Get message ID
public fun message_id(proposal: &Proposal): ID {
    proposal.message_id
}

/// Get creator
public fun creator(proposal: &Proposal): address {
    proposal.creator
}

/// Get title
public fun title(proposal: &Proposal): String {
    proposal.title
}

/// Get description
public fun description(proposal: &Proposal): String {
    proposal.description
}

/// Get deadline
public fun deadline(proposal: &Proposal): u64 {
    proposal.deadline
}

/// Get status
public fun status(proposal: &Proposal): u8 {
    proposal.status
}

/// Get vote counts
public fun yes_votes(proposal: &Proposal): u64 {
    proposal.yes_votes
}

public fun no_votes(proposal: &Proposal): u64 {
    proposal.no_votes
}

public fun abstain_votes(proposal: &Proposal): u64 {
    proposal.abstain_votes
}

public fun total_voters(proposal: &Proposal): u64 {
    proposal.total_voters
}

/// Cast a vote on a proposal
public fun cast_vote(
    proposal: &mut Proposal,
    vote: Vote,
    clock: &Clock
) {
    let current_time = clock::timestamp_ms(clock);
    assert!(proposal.status == STATUS_ACTIVE, 0);
    assert!(current_time < proposal.deadline, 1);
    
    let voter = voting::voter(&vote);
    let vote_type = voting::vote_type(&vote);
    let vote_weight = voting::vote_weight(&vote);
    if (voting::has_voted(&proposal.id, voter)) {
        let old_vote_opt = voting::get_vote(&proposal.id, voter);
        let old_vote = *std::option::borrow(&old_vote_opt);
        let old_type = voting::vote_type(&old_vote);
        let old_weight = voting::vote_weight(&old_vote);
        if (old_type == 1) {
            proposal.yes_votes = proposal.yes_votes - old_weight;
        } else if (old_type == 0) {
            proposal.no_votes = proposal.no_votes - old_weight;
        } else {
            proposal.abstain_votes = proposal.abstain_votes - old_weight;
        };
        voting::remove_vote(&mut proposal.id, voter);
    } else {
        proposal.total_voters = proposal.total_voters + 1;
    };
    voting::add_vote(&mut proposal.id, voter, vote);
    if (vote_type == 1) {
        proposal.yes_votes = proposal.yes_votes + vote_weight;
    } else if (vote_type == 0) {
        proposal.no_votes = proposal.no_votes + vote_weight;
    } else {
        proposal.abstain_votes = proposal.abstain_votes + vote_weight;
    };
}

/// Finalize proposal and calculate result
public fun finalize(proposal: &mut Proposal, clock: &Clock) {
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time >= proposal.deadline, 0);
    assert!(proposal.status == STATUS_ACTIVE, 1);
    if (proposal.yes_votes > proposal.no_votes) {
        proposal.status = STATUS_PASSED;
    } else {
        proposal.status = STATUS_FAILED;
    };
}

/// Check if proposal is expired
public fun is_expired(proposal: &Proposal, clock: &Clock): bool {
    let current_time = clock::timestamp_ms(clock);
    current_time >= proposal.deadline
}

/// Update proposal status if expired
public fun update_status_if_expired(proposal: &mut Proposal, clock: &Clock) {
    if (proposal.status == STATUS_ACTIVE && is_expired(proposal, clock)) {
        proposal.status = STATUS_EXPIRED;
    };
}

