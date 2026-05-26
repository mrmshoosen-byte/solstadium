// Solana Anchor Smart Contract for World Cup Betting
// File: programs/world_cup_betting/src/lib.rs

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("YourProgramIDHere");

#[program]
pub mod world_cup_betting {
    use super::*;

    // Initialize match escrow - called when match is created
    pub fn create_match(
        ctx: Context<CreateMatch>,
        match_id: String,
        player1: Pubkey,
        player2: Pubkey,
        bet_amount: u64,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        
        match_account.match_id = match_id;
        match_account.player1 = player1;
        match_account.player2 = player2;
        match_account.bet_amount = bet_amount;
        match_account.total_pot = bet_amount * 2;
        match_account.status = MatchStatus::Pending;
        match_account.created_at = Clock::get()?.unix_timestamp;
        match_account.escrow_balance = 0;

        emit!(MatchCreated {
            match_id: match_account.match_id.clone(),
            player1: player1,
            player2: player2,
            pot_amount: bet_amount * 2,
            timestamp: match_account.created_at,
        });

        Ok(())
    }

    // Player 1 deposits their bet
    pub fn deposit_bet_player1(
        ctx: Context<DepositBet>,
        match_id: String,
        amount: u64,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        
        // Verify match exists and is in correct status
        require!(
            match_account.status == MatchStatus::Pending,
            BettingError::InvalidMatchStatus
        );

        // Verify amount matches expected bet
        require!(
            amount == match_account.bet_amount,
            BettingError::InvalidBetAmount
        );

        // Transfer SOL from player1 to escrow
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.player1.key(),
            &ctx.accounts.escrow_account.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.player1.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ],
        )?;

        match_account.player1_deposited = true;
        match_account.escrow_balance += amount;

        // If both players have deposited, move to team selection
        if match_account.player1_deposited && match_account.player2_deposited {
            match_account.status = MatchStatus::WaitingTeamSelection;
        }

        emit!(BetDeposited {
            match_id: match_id,
            player: ctx.accounts.player1.key(),
            amount: amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Player 2 deposits their bet
    pub fn deposit_bet_player2(
        ctx: Context<DepositBet>,
        match_id: String,
        amount: u64,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        
        require!(
            match_account.status == MatchStatus::Pending,
            BettingError::InvalidMatchStatus
        );

        require!(
            amount == match_account.bet_amount,
            BettingError::InvalidBetAmount
        );

        // Transfer SOL from player2 to escrow
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.player2.key(),
            &ctx.accounts.escrow_account.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.player2.to_account_info(),
                ctx.accounts.escrow_account.to_account_info(),
            ],
        )?;

        match_account.player2_deposited = true;
        match_account.escrow_balance += amount;

        if match_account.player1_deposited && match_account.player2_deposited {
            match_account.status = MatchStatus::WaitingTeamSelection;
        }

        emit!(BetDeposited {
            match_id: match_id,
            player: ctx.accounts.player2.key(),
            amount: amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Record team selections and match start
    pub fn record_teams(
        ctx: Context<RecordTeams>,
        match_id: String,
        player1_team: String,
        player2_team: String,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::WaitingTeamSelection,
            BettingError::InvalidMatchStatus
        );

        match_account.player1_team = player1_team.clone();
        match_account.player2_team = player2_team.clone();
        match_account.status = MatchStatus::Live;
        match_account.started_at = Clock::get()?.unix_timestamp;

        emit!(TeamsSelected {
            match_id: match_id,
            player1_team: player1_team,
            player2_team: player2_team,
            timestamp: match_account.started_at,
        });

        Ok(())
    }

    // Submit match result and distribute winnings
    pub fn submit_result(
        ctx: Context<SubmitResult>,
        match_id: String,
        player1_score: u8,
        player2_score: u8,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::Live,
            BettingError::InvalidMatchStatus
        );

        require!(
            player1_score <= 5 && player2_score <= 5,
            BettingError::InvalidScore
        );

        // Record scores
        match_account.player1_score = player1_score;
        match_account.player2_score = player2_score;

        // Determine winner
        let (winner, winner_payout, platform_fee) = if player1_score > player2_score {
            (
                WinnerType::Player1,
                (match_account.total_pot * 98) / 100,
                (match_account.total_pot * 2) / 100,
            )
        } else if player2_score > player1_score {
            (
                WinnerType::Player2,
                (match_account.total_pot * 98) / 100,
                (match_account.total_pot * 2) / 100,
            )
        } else {
            // Draw - split 50/50 minus platform fee
            (
                WinnerType::Draw,
                (match_account.total_pot * 49) / 100, // Each player gets this
                (match_account.total_pot * 2) / 100,
            )
        };

        match_account.winner = winner.clone();
        match_account.status = MatchStatus::Completed;
        match_account.completed_at = Clock::get()?.unix_timestamp;

        // Distribute funds
        match winner {
            WinnerType::Player1 => {
                // Pay player 1 (98% of pot)
                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    winner_payout;
                **ctx.accounts.player1.lamports.borrow_mut() += winner_payout;

                // Pay platform fee
                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    platform_fee;
                **ctx.accounts.platform_wallet.lamports.borrow_mut() +=
                    platform_fee;

                emit!(MatchCompleted {
                    match_id: match_id.clone(),
                    winner: ctx.accounts.player1.key(),
                    winner_payout: winner_payout,
                    platform_fee: platform_fee,
                    timestamp: match_account.completed_at,
                });
            }
            WinnerType::Player2 => {
                // Pay player 2 (98% of pot)
                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    winner_payout;
                **ctx.accounts.player2.lamports.borrow_mut() += winner_payout;

                // Pay platform fee
                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    platform_fee;
                **ctx.accounts.platform_wallet.lamports.borrow_mut() +=
                    platform_fee;

                emit!(MatchCompleted {
                    match_id: match_id.clone(),
                    winner: ctx.accounts.player2.key(),
                    winner_payout: winner_payout,
                    platform_fee: platform_fee,
                    timestamp: match_account.completed_at,
                });
            }
            WinnerType::Draw => {
                // Split winnings 50/50
                let split_payout = winner_payout / 2;

                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    split_payout * 2;
                **ctx.accounts.player1.lamports.borrow_mut() += split_payout;
                **ctx.accounts.player2.lamports.borrow_mut() += split_payout;

                // Pay platform fee
                **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                    platform_fee;
                **ctx.accounts.platform_wallet.lamports.borrow_mut() +=
                    platform_fee;

                emit!(MatchCompleted {
                    match_id: match_id.clone(),
                    winner: Pubkey::default(), // No winner in draw
                    winner_payout: split_payout,
                    platform_fee: platform_fee,
                    timestamp: match_account.completed_at,
                });
            }
        }

        Ok(())
    }

    // Refund bets if match is cancelled/invalid
    pub fn refund_match(
        ctx: Context<RefundMatch>,
        match_id: String,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;

        require!(
            match_account.status == MatchStatus::Pending
                || match_account.status == MatchStatus::WaitingTeamSelection,
            BettingError::CannotRefundCompleted
        );

        let refund_amount = match_account.bet_amount;

        // Refund player 1
        if match_account.player1_deposited {
            **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                refund_amount;
            **ctx.accounts.player1.lamports.borrow_mut() += refund_amount;
        }

        // Refund player 2
        if match_account.player2_deposited {
            **ctx.accounts.escrow_account.lamports.borrow_mut() -=
                refund_amount;
            **ctx.accounts.player2.lamports.borrow_mut() += refund_amount;
        }

        match_account.status = MatchStatus::Refunded;

        emit!(MatchRefunded {
            match_id: match_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// ============= ACCOUNT STRUCTURES =============

#[account]
pub struct MatchAccount {
    pub match_id: String,          // Unique match identifier
    pub player1: Pubkey,           // Player 1 wallet
    pub player2: Pubkey,           // Player 2 wallet
    pub bet_amount: u64,           // Amount each player bets (in lamports)
    pub total_pot: u64,            // Total pool (bet_amount * 2)
    pub player1_deposited: bool,
    pub player2_deposited: bool,
    pub player1_team: String,
    pub player2_team: String,
    pub player1_score: u8,
    pub player2_score: u8,
    pub status: MatchStatus,       // Current match status
    pub winner: WinnerType,        // Match result
    pub escrow_balance: u64,
    pub created_at: i64,
    pub started_at: i64,
    pub completed_at: i64,
}

// ============= ENUMS =============

#[derive(Clone, PartialEq, Eq)]
pub enum MatchStatus {
    Pending,
    WaitingTeamSelection,
    Live,
    Completed,
    Refunded,
}

#[derive(Clone)]
pub enum WinnerType {
    Player1,
    Player2,
    Draw,
    None,
}

// ============= CONTEXT STRUCTURES =============

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 32 + 32 + 1 + 1 + 1 + 1 + 8 + 8 + 8 + 8,
        seeds = [b"match", match_id.as_bytes()],
        bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String, amount: u64)]
pub struct DepositBet<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub player1: Signer<'info>,

    #[account(mut)]
    pub player2: Signer<'info>,

    #[account(mut)]
    pub escrow_account: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct RecordTeams<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,
}

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub player1: AccountInfo<'info>,

    #[account(mut)]
    pub player2: AccountInfo<'info>,

    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,

    /// Your wallet address: 5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU
    #[account(mut)]
    pub platform_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,

    #[account(mut)]
    pub player1: AccountInfo<'info>,

    #[account(mut)]
    pub player2: AccountInfo<'info>,

    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
}

// ============= EVENTS =============

#[event]
pub struct MatchCreated {
    pub match_id: String,
    pub player1: Pubkey,
    pub player2: Pubkey,
    pub pot_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct BetDeposited {
    pub match_id: String,
    pub player: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TeamsSelected {
    pub match_id: String,
    pub player1_team: String,
    pub player2_team: String,
    pub timestamp: i64,
}

#[event]
pub struct MatchCompleted {
    pub match_id: String,
    pub winner: Pubkey,
    pub winner_payout: u64,
    pub platform_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct MatchRefunded {
    pub match_id: String,
    pub timestamp: i64,
}

// ============= ERROR HANDLING =============

#[error_code]
pub enum BettingError {
    #[msg("Invalid match status for this operation")]
    InvalidMatchStatus,

    #[msg("Bet amount does not match match requirements")]
    InvalidBetAmount,

    #[msg("Invalid score submitted")]
    InvalidScore,

    #[msg("Cannot refund a completed match")]
    CannotRefundCompleted,

    #[msg("Insufficient funds in escrow")]
    InsufficientEscrowBalance,

    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
}
