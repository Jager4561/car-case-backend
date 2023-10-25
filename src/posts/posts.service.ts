export const countLikesAndDislikes = (ratings: any, account: string | null) => {
  let likesCount = 0;
  let dislikesCount = 0;
  let liked = false;
  let disliked = false;

  ratings.forEach((rating: any) => {
    if (rating) {
      likesCount++;
    } else {
      dislikesCount++;
    }
    if (
      rating.account &&
      account &&
      rating.account === account
    ) {
      if (rating.rating === 'like') {
        liked = true;
      } else {
        disliked = true;
      }
    }
  });

  return {
    likesCount,
    dislikesCount,
    liked,
    disliked
  }
}