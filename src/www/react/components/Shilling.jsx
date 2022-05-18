import React from "react";

import '../styles/Shilling.scss';
import Carrd  from '../assets/Carrd.png';
import Tiktok from '../assets/Tiktok.png';
import Twitch from '../assets/Twitch.png';
import Twitter from '../assets/Twitter.png';
import Youtube from '../assets/Youtube.png';
import Pixiv from '../assets/Pixiv.png';
import Patreon from '../assets/Patreon.png';

const Shilling = () => {
  return (
    <main className="Shilling">
      <h1>
        GREMLIN SOUL BUT TWITCH V-BNUY AT HEART
      </h1> 
      <div className="ShillCards">
        <a className="ShillCard" href="https://daishuquee.carrd.co/" target="_blank">
          <img src={Carrd} alt="Carrd.png" />
          <p>
            Commissions
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://twitch.tv/daishutv" target="_blank">
          <img src={Twitch} alt="Twitch.png" />
          <p>
            Twitch
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://www.tiktok.com/@daishutv" target="_blank">
          <img src={Tiktok} alt="Tiktok.png" />
          <p>
            TikTok
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://twitter.com/daishuquee" target="_blank">
          <img src={Twitter} alt="Twitter.png" />
          <p>
            Twitter
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://www.youtube.com/channel/UChTHmPh77XG47kN9uL3mhhg" target="_blank">
          <img src={Youtube} alt="Youtube.png" />
          <p>
            Youtube
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://www.patreon.com/daishu" target="_blank">
          <img src={Patreon} alt="Patreon.png" />
          <p>
            Patreon
          </p>
          <div></div>
        </a>

        <a className="ShillCard" href="https://www.pixiv.net/member.php?id=36112049" target="_blank">
          <img src={Pixiv} alt="Pixiv.png" />
          <p>
            Pixiv
          </p>
          <div></div>
        </a>
      </div>

    </main>
  )
}

export default Shilling;