using CSharpClicker.UseCases.GetBoosts;
using CSharpClicker.UseCases.GetCurrentUserInfo;
using CSharpClicker.UseCases.GetLeaderboard;
using CSharpClicker.ViewModels;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CSharpClicker.Controllers;

[Authorize]
public class HomeController : Controller
{
    private readonly IMediator mediator;

    public HomeController(IMediator mediator)
    {
        this.mediator = mediator;
    }

    public async Task<IActionResult> Index()
    {
        var user = await mediator.Send(new GetCurrentUserInfoQuery());
        var boosts = await mediator.Send(new GetBoostsQuery());

        var viewModel = new IndexViewModel
        {
            UserInfo = user,
            Boosts = boosts,
        };
        return View(viewModel);
    }

    // новый метод
    [HttpGet]
    public async Task<IActionResult> Leaderboard(int page = 1)
    {
        // Отправляем запрос с размером страницы 10 (можно менять)
        var viewModel = await mediator.Send(new GetLeaderboardQuery(page, 10));
        return View(viewModel);
    }
}